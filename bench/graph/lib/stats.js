function percentile(sortedValues, percentile) {
  if (!sortedValues.length) return 0
  const rank = Math.ceil((percentile / 100) * sortedValues.length)
  const idx = Math.min(sortedValues.length - 1, Math.max(0, rank - 1))
  return sortedValues[idx]
}

export function computeStats({ durationsMs = [], errorCount = 0 }) {
  const successes = durationsMs.length
  const totalSamples = successes + errorCount
  if (!successes) {
    return {
      samples: totalSamples,
      opsPerSec: 0,
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      stdevMs: 0,
      errorCount,
    }
  }

  const sorted = [...durationsMs].sort((a, b) => a - b)
  const totalMs = durationsMs.reduce((acc, n) => acc + n, 0)
  const avg = totalMs / successes
  const variance = durationsMs.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / successes
  const stdev = Math.sqrt(variance)
  const opsPerSec = successes ? successes / (totalMs / 1000) : 0

  return {
    samples: totalSamples,
    opsPerSec,
    avgMs: avg,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    stdevMs: stdev,
    errorCount,
  }
}

export function mergeSummaries(rows = []) {
  return rows.reduce((acc, row) => {
    acc.totalCases += 1
    acc.totalSamples += row.metrics?.samples ?? 0
    acc.totalErrors += row.metrics?.errorCount ?? 0
    return acc
  }, { totalCases: 0, totalSamples: 0, totalErrors: 0 })
}
