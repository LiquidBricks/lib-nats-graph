import { operationFactoryKey, operationNameKey, operationName, operationResultType, operationResultTypeKey, Errors, operationStreamWrapperKey } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { readChunkedSet } from '../kv/kvUtils.js'

const normalizeLabels = (args) => {
  if (!Array.isArray(args)) return []
  return args
    .filter((label) => label != null && label !== '')
    .map((label) => String(label))
}

const collectEdgeIds = async ({ store, vertexId, labels = [], dedupe }) => {
  const ids = new Set()

  const collectFromSources = async ({ metaKey, chunkKeyForIndex, pattern }) => {
    const chunked = await readChunkedSet(store, { metaKey, chunkKeyForIndex })
    const fromKeys = await (async () => {
      const keys = await store.keys(pattern).catch(() => [])
      const acc = []
      for await (const key of keys) {
        const edgeId = key.split('.').pop()
        if (edgeId && edgeId !== '__index') acc.push(edgeId)
      }
      return acc
    })()

    for (const edgeId of new Set([...chunked, ...fromKeys])) {
      if (!edgeId || edgeId === '__index') continue
      if (dedupe?.has(edgeId)) continue
      ids.add(edgeId)
      dedupe?.add(edgeId)
    }
  }

  if (labels.length > 0) {
    for (const label of labels) {
      await collectFromSources({
        metaKey: graphKeyspace.adj.outE.labelMeta(vertexId, label),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.labelChunk(vertexId, label, idx),
        pattern: graphKeyspace.vertex.outE.patternByLabel(vertexId, label),
      })
    }
  } else {
    await collectFromSources({
      metaKey: graphKeyspace.adj.outE.meta(vertexId),
      chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.chunk(vertexId, idx),
      pattern: graphKeyspace.vertex.outE.pattern(vertexId),
    })
  }

  return ids
}

export const outE = {
  [operationNameKey]: operationName.outE,
  [operationResultTypeKey]: operationResultType.edge,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const wanted = new Set(normalizeLabels(args))
    diagnostics?.require(!!store, Errors.KVSTORE_MISSING, 'kvStore required in ctx for outE() traversal', { where: 'VtoE/outE.stream' });

    return (source) => (async function* () {
      const seen = new Set()
      for await (const parent of source) {
        const vertexId = parent == null ? null : String(parent)
        if (!vertexId) continue

        try {
          const ids = await collectEdgeIds({
            store,
            vertexId,
            labels: Array.from(wanted),
            dedupe: seen
          })
          for (const id of ids) {
            yield id
          }
        } catch {
          /* ignore traversal errors */
        }
      }
    })()
  },
  [operationFactoryKey]({ parent, ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const vertexId = parent == null ? null : String(parent)
    if (!vertexId) {
      async function* empty() { }
      return { [Symbol.asyncIterator]: empty }
    }

    const wanted = new Set(normalizeLabels(args))

    return {
      [Symbol.asyncIterator]: (async function* () {
        const ids = await collectEdgeIds({
          store,
          vertexId,
          labels: Array.from(wanted)
        })

        for (const id of ids) {
          if (id != null) yield id
        }
      })
    }
  }
}
