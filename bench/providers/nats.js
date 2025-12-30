export function natsProviderConfig() {
  return {
    provider: 'nats',
    kvConfig: {
      servers: process.env.NATS_BENCH_SERVERS ?? '10.88.0.3',
      bucket: process.env.NATS_BENCH_BUCKET ?? 'nats-graph-benchmark',
    },
  }
}
