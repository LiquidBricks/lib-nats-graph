export function nowNs() {
  return process.hrtime.bigint()
}

export function durationMs(startNs) {
  const delta = process.hrtime.bigint() - startNs
  return Number(delta) / 1e6
}

export async function timeAsync(fn) {
  const start = nowNs()
  await fn()
  return durationMs(start)
}

export async function withTimeout(promise, timeoutMs) {
  if (!timeoutMs) return promise
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`Timed out after ${timeoutMs}ms`)
      err.code = 'BENCH_TIMEOUT'
      reject(err)
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}
