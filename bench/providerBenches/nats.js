import { natsProviderConfig } from '../providers/nats.js'
import { createProviderBench } from '../providerBenchRunner.js'

export async function createNatsProviderBench() {
  return createProviderBench(natsProviderConfig())
}
