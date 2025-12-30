import { runBenchSuite } from '../../lib/benchRunner.js'
import { ensureDataset, listAvailableSizes } from '../../datasets/generator.js'
import { createGraphClient } from '../../lib/provider.js'
import { buildWorkloads } from '../workload/workloads.js'

const DEFAULT_SCALE_SAMPLES = 200
const DEFAULT_SCALE_WARMUP = 25
const ALL_TOPOLOGIES = ['uniform', 'hub', 'chain']

export const SCALE_DEFAULTS = {
  samples: DEFAULT_SCALE_SAMPLES,
  warmup: DEFAULT_SCALE_WARMUP,
}

function resolveSizes(requested = [], respectScaleDefault = true) {
  const sizes = listAvailableSizes()
  if (!requested.length || requested.includes('all')) {
    return Object.entries(sizes)
      .filter(([, cfg]) => !respectScaleDefault || cfg.scaleDefault !== false)
      .map(([label]) => label)
  }
  return requested.filter((label) => sizes[label])
}

function resolveTopologies(requested = []) {
  if (!requested.length || requested.includes('all')) return ALL_TOPOLOGIES
  return requested.filter((t) => ALL_TOPOLOGIES.includes(t))
}

export async function runScaleSuite({
  provider,
  topologies = [],
  sizes = [],
  seed,
  samples,
  warmup,
  concurrency,
  timeoutMs,
  regen = false,
  onResult,
  logger = console,
}) {
  const chosenTopologies = resolveTopologies(topologies)
  const chosenSizes = resolveSizes(sizes, true)
  const results = []

  for (const topology of chosenTopologies) {
    for (const sizeLabel of chosenSizes) {
      logger.log(`Running scale workloads for ${topology}/${sizeLabel}`)
      const dataset = await ensureDataset({
        provider,
        topology,
        sizeLabel,
        seed,
        regen,
        logger,
      })
      const graph = createGraphClient(provider)
      try {
        const cases = buildWorkloads({ g: graph.g, dataset })
        const rows = await runBenchSuite({
          suite: 'scale',
          provider,
          g: graph.g,
          dataset,
          cases,
          samples: samples ?? DEFAULT_SCALE_SAMPLES,
          warmup: warmup ?? DEFAULT_SCALE_WARMUP,
          concurrency,
          timeoutMs,
          onResult,
        })
        results.push(...rows)
      } finally {
        await graph.close?.()
      }
    }
  }

  return results
}

export { resolveSizes as resolveScaleSizes, resolveTopologies as resolveScaleTopologies }
