import { runBenchSuite } from '../../lib/benchRunner.js'
import { ensureDataset } from '../../datasets/generator.js'
import { createGraphClient } from '../../lib/provider.js'
import { buildWorkloads, workloadDefaults } from './workloads.js'

export async function runWorkloadSuite({
  provider,
  topology,
  sizeLabel,
  seed,
  samples,
  warmup,
  concurrency,
  timeoutMs,
  regen = false,
  onResult,
  logger = console,
}) {
  const defaults = workloadDefaults()
  const dataset = await ensureDataset({
    provider,
    topology: topology || defaults.topology,
    sizeLabel: sizeLabel || defaults.datasetSize,
    seed,
    regen,
    logger,
  })
  const graph = createGraphClient(provider)
  try {
    const cases = buildWorkloads({ g: graph.g, dataset })
    return await runBenchSuite({
      suite: 'workload',
      provider,
      g: graph.g,
      dataset,
      cases,
      samples: samples ?? defaults.samples,
      warmup: warmup ?? defaults.warmup,
      concurrency,
      timeoutMs,
      onResult,
    })
  } finally {
    await graph.close?.()
  }
}
