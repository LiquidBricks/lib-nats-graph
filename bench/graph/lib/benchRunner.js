import { warmup } from './warmup.js'
import { nowNs, durationMs, withTimeout } from './timers.js'
import { computeStats } from './stats.js'

function pickSample(caseDef, dataset, index) {
  if (typeof caseDef.sample === 'function') {
    return caseDef.sample({ dataset, index })
  }
  if (!caseDef.sampleSet) return undefined
  const set = dataset.samples?.[caseDef.sampleSet] || []
  if (!set.length) return undefined
  return set[index % set.length]
}

async function runPool({ total, concurrency, handler }) {
  let index = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < total) {
      const current = index++
      await handler(current)
    }
  })
  await Promise.all(workers)
}

export async function runBenchSuite({
  suite,
  provider,
  g,
  dataset,
  cases = [],
  samples = 500,
  warmup: warmupCount = 50,
  concurrency = 1,
  timeoutMs = 30000,
  onResult,
}) {
  const results = []
  for (const caseDef of cases) {
    const caseSamples = caseDef.samples ?? samples
    const caseWarmup = caseDef.warmup ?? warmupCount
    const context = { g, dataset, provider, case: caseDef }
    if (caseDef.beforeCase) await caseDef.beforeCase(context)

    await warmup({
      count: caseWarmup,
      concurrency,
      fn: (idx) => caseDef.run({
        ...context,
        phase: 'warmup',
        sample: pickSample(caseDef, dataset, idx),
        sampleIndex: idx,
      }),
    })

    const durations = []
    let errorCount = 0
    const startCase = nowNs()
    await runPool({
      total: caseSamples,
      concurrency,
      handler: async (idx) => {
        const start = nowNs()
        try {
          const runPromise = Promise.resolve(caseDef.run({
            ...context,
            phase: 'sample',
            sample: pickSample(caseDef, dataset, idx),
            sampleIndex: idx,
          }))
          await withTimeout(runPromise, timeoutMs)
          durations.push(durationMs(start))
        } catch (err) {
          errorCount += 1
        }
      },
    })
    const totalCaseMs = durationMs(startCase)
    const metrics = computeStats({ durationsMs: durations, errorCount })
    const row = {
      suite,
      provider,
      dataset: dataset.meta,
      case: {
        name: caseDef.name,
        kind: caseDef.kind,
        params: caseDef.params || {},
      },
      metrics: {
        ...metrics,
        durationMs: totalCaseMs,
      },
    }
    results.push(row)
    if (onResult) await onResult(row)
    if (caseDef.afterCase) await caseDef.afterCase({ ...context, result: row })
  }
  return results
}
