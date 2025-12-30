import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Graph } from '../../../graph/graph.js'
import { resolveProviderConfig } from '../lib/env.js'
import { buildSampleSets, createPrng } from '../lib/sampling.js'
import { buildUniformTopology } from './topologies/uniform.js'
import { buildHubTopology } from './topologies/hub.js'
import { buildChainTopology } from './topologies/chain.js'
import { kvProviderFactory } from '../../../kvProvider/factory.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sizesPath = path.join(__dirname, '..', 'config', 'sizes.json')
const manifestsDir = path.join(__dirname, 'manifests')
const DATASET_MARKER_KEY = '__bench.dataset.id'

const vertexLabels = ['person', 'project', 'service', 'device']
const edgeLabels = ['knows', 'uses', 'depends', 'connects']

function readSizesConfig() {
  const raw = fs.readFileSync(sizesPath, 'utf8')
  return JSON.parse(raw)
}

function manifestPathFor(id) {
  return path.join(manifestsDir, `${id}.json`)
}

async function readManifest(manifestPath) {
  const raw = await fs.promises.readFile(manifestPath, 'utf8').catch(() => null)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeManifest(manifestPath, payload) {
  await fs.promises.mkdir(path.dirname(manifestPath), { recursive: true })
  await fs.promises.writeFile(manifestPath, JSON.stringify(payload, null, 2) + '\n')
}

function computeDegrees(degreeArr) {
  if (!degreeArr.length) return { min: 0, max: 0, avg: 0 }
  let min = Number.POSITIVE_INFINITY
  let max = 0
  let total = 0
  for (const v of degreeArr) {
    min = Math.min(min, v)
    max = Math.max(max, v)
    total += v
  }
  return {
    min,
    max,
    avg: total / degreeArr.length,
  }
}

async function markDataset({ provider, kvConfig, datasetId, diagnostics }) {
  const kvProvider = kvProviderFactory(provider)
  const kvStore = await kvProvider({ config: kvConfig, ctx: { diagnostics } })
  try {
    await kvStore.interface.put(DATASET_MARKER_KEY, datasetId)
  } finally {
    await kvStore.close?.()
  }
}

async function readDatasetMarker({ provider, kvConfig, diagnostics }) {
  const kvProvider = kvProviderFactory(provider)
  const kvStore = await kvProvider({ config: kvConfig, ctx: { diagnostics } })
  try {
    const data = await kvStore.interface.get(DATASET_MARKER_KEY).catch(() => null)
    if (!data) return null
    return data.string()
  } finally {
    await kvStore.close?.()
  }
}

async function createVertices({ g, count, rng, hotsetRatio }) {
  const vertexIds = []
  const hotCount = Math.max(1, Math.floor(count * hotsetRatio))
  const hotVertexIds = []
  const hubCount = Math.max(1, Math.floor(count * 0.02))
  for (let i = 0; i < count; i++) {
    const label = vertexLabels[Math.floor(rng() * vertexLabels.length)]
    const [id] = await g.addV(label)
    vertexIds.push(id)
    await g.V(id).property('name', `v-${i}`)
    await g.V(id).property('group', i % 10)
    if (i < hotCount) {
      hotVertexIds.push(id)
      await g.V(id).property('hot', true)
    }
  }
  return {
    vertexIds,
    hotVertexIds,
    hubVertexIds: vertexIds.slice(0, hubCount),
  }
}

function createReservoir(capacity, rng) {
  let count = 0
  const data = []
  return {
    push(value) {
      count += 1
      if (data.length < capacity) {
        data.push(value)
        return
      }
      const idx = Math.floor(rng() * count)
      if (idx < capacity) data[idx] = value
    },
    values() {
      return data.slice()
    }
  }
}

async function generateEdges({
  g,
  topology,
  vertexIds,
  hubVertexIds,
  edgeCount,
  rng,
}) {
  const vertexIndex = new Map(vertexIds.map((id, idx) => [id, idx]))
  const outDegree = new Array(vertexIds.length).fill(0)
  const inDegree = new Array(vertexIds.length).fill(0)
  const edgeReservoir = createReservoir(5000, rng)
  const weightedEdgeIds = []
  let created = 0
  const onEdge = async ({ edgeId, src, dst }) => {
    created += 1
    edgeReservoir.push(edgeId)
    const srcIdx = vertexIndex.get(src)
    const dstIdx = vertexIndex.get(dst)
    if (srcIdx !== undefined) outDegree[srcIdx] += 1
    if (dstIdx !== undefined) inDegree[dstIdx] += 1
    if (created % 5 === 0) {
      await g.E(edgeId).property('weight', (created % 5) + 1)
      weightedEdgeIds.push(edgeId)
    }
  }

  const params = { g, vertexIds, hubVertexIds, edgeCount, rng, labelPool: edgeLabels, onEdge }
  switch (topology) {
    case 'uniform':
      await buildUniformTopology(params)
      break
    case 'hub':
      await buildHubTopology(params)
      break
    case 'chain':
      await buildChainTopology(params)
      break
    default:
      throw new Error(`Unknown topology "${topology}"`)
  }

  const degreeStats = {
    out: computeDegrees(outDegree),
    in: computeDegrees(inDegree),
  }

  // Choose hubs as highest out-degree vertices if available
  const indexedDegrees = outDegree.map((deg, idx) => ({ deg, idx }))
  indexedDegrees.sort((a, b) => b.deg - a.deg)
  const hubSample = indexedDegrees.slice(0, Math.min(100, indexedDegrees.length)).map(({ idx }) => vertexIds[idx])

  return {
    edgeSampleIds: edgeReservoir.values(),
    weightedEdgeIds,
    edgesCreated: created,
    degreeStats,
    hubCandidates: hubSample,
  }
}

export async function ensureDataset({
  provider,
  topology,
  sizeLabel,
  seed = 1,
  regen = false,
  logger = console,
} = {}) {
  const sizes = readSizesConfig()
  const sizeConfig = sizes[sizeLabel]
  if (!sizeConfig) throw new Error(`Unknown size label "${sizeLabel}"`)
  const hotsetRatio = sizeConfig.hotsetRatio ?? 0.1
  const datasetId = `${provider}-${topology}-${sizeLabel}-${seed}`
  const manifestPath = manifestPathFor(datasetId)
  const diagnostics = createDiagnostics().child({ suite: 'graph-bench', datasetId })
  const { kvConfig } = resolveProviderConfig(provider)

  if (!regen) {
    const existing = await readManifest(manifestPath)
    const marker = await readDatasetMarker({ provider, kvConfig, diagnostics })
    if (existing && marker === datasetId) {
      return {
        meta: existing.meta,
        samples: existing.samples,
        manifestPath,
      }
    }
  }

  const graph = Graph({ kv: provider, kvConfig, diagnostics })
  const { g } = graph
  logger.log(`Generating dataset ${datasetId}...`)
  await g.drop()

  const rng = createPrng(seed)
  const vertexBuild = await createVertices({ g, count: sizeConfig.vertices, rng, hotsetRatio })

  const edgeBuild = await generateEdges({
    g,
    topology,
    vertexIds: vertexBuild.vertexIds,
    hubVertexIds: vertexBuild.hubVertexIds,
    edgeCount: sizeConfig.edges,
    rng,
  })

  const hubVertexIds = edgeBuild.hubCandidates.length ? edgeBuild.hubCandidates : vertexBuild.hubVertexIds
  const samples = buildSampleSets({
    vertices: vertexBuild.vertexIds,
    edges: edgeBuild.edgeSampleIds,
    hotVertices: vertexBuild.hotVertexIds,
    hubVertices: hubVertexIds,
    seed,
  })

  // Annotate edges used for sampling to keep valueMap/property ops meaningful
  const uniqueWeighted = new Set([...edgeBuild.weightedEdgeIds, ...samples.randomEdgeIds])
  for (const edgeId of uniqueWeighted) {
    await g.E(edgeId).property('weight', (seed % 5) + 1)
  }

  const manifest = {
    meta: {
      id: datasetId,
      topology,
      sizeLabel,
      seed,
      vertices: sizeConfig.vertices,
      edges: edgeBuild.edgesCreated,
      hotsetRatio,
      degree: edgeBuild.degreeStats,
    },
    samples,
    hotVertexIds: vertexBuild.hotVertexIds,
    hubVertexIds,
    generatedAt: new Date().toISOString(),
  }

  await writeManifest(manifestPath, manifest)
  await markDataset({ provider, kvConfig, datasetId, diagnostics })
  await graph.close?.()
  logger.log(`Generated dataset ${datasetId} (${sizeConfig.vertices}V / ${edgeBuild.edgesCreated}E)`)

  return {
    meta: manifest.meta,
    samples: manifest.samples,
    manifestPath,
  }
}

export function listAvailableSizes() {
  return readSizesConfig()
}
