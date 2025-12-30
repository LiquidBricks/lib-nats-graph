import { redisProviderConfig } from '../providers/redis.js'
import { createProviderBench } from '../providerBenchRunner.js'

export async function createRedisProviderBench() {
  return createProviderBench(redisProviderConfig())
}
