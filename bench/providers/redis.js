export function redisProviderConfig() {
  const db = process.env.REDIS_BENCH_DATABASE ?? process.env.REDIS_BENCH_DB
  const database = Number.isFinite(Number(db)) ? Number(db) : undefined
  return {
    provider: 'redis',
    kvConfig: {
      url: process.env.REDIS_BENCH_URL ?? 'redis://127.0.0.1:6379',
      keyPrefix: process.env.REDIS_BENCH_PREFIX ?? 'nats-graph-benchmark',
      ...(database !== undefined ? { database } : {}),
    },
  }
}
