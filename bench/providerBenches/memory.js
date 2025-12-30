import { memoryProviderConfig } from '../providers/memory.js'
import { createProviderBench } from '../providerBenchRunner.js'

export async function createMemoryProviderBench() {
  return createProviderBench(memoryProviderConfig())
}
