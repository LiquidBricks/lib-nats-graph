async function runPool({ total, concurrency, handler }) {
  let index = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < total) {
      const current = index++
      try {
        await handler(current)
      } catch {
        // Warmup errors are ignored
      }
    }
  })
  await Promise.all(workers)
}

export async function warmup({ count = 0, concurrency = 1, fn }) {
  if (!count || typeof fn !== 'function') return
  await runPool({
    total: count,
    concurrency,
    handler: async (idx) => fn(idx),
  })
}
