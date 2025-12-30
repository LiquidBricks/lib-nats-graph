import { runBenchSuite } from '../../lib/benchRunner.js'
import { ensureDataset } from '../../datasets/generator.js'
import { createGraphClient } from '../../lib/provider.js'
import { buildMicroCases } from './steps.js'

export async function runMicroSuite({
  provider,
  seed,
  samples,
  warmup,
  concurrency,
  timeoutMs,
  regen = false,
  onResult,
  logger = console,
}) {
  const dataset = await ensureDataset({
    provider,
    topology: 'uniform',
    sizeLabel: 'S1',
    seed,
    regen,
    logger,
  })
  const graph = createGraphClient(provider)
  try {
    const cases = await buildMicroCases({ g: graph.g, dataset })
    return await runBenchSuite({
      suite: 'micro',
      provider,
      g: graph.g,
      dataset,
      cases,
      samples,
      warmup,
      concurrency,
      timeoutMs,
      onResult,
    })
  } finally {
    await graph.close?.()
  }
}
