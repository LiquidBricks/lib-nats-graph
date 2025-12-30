import { Graph } from '../../../graph/graph.js'
import { resolveProviderConfig } from './env.js'

export function createGraphClient(provider, diagnostics) {
  const { kvConfig } = resolveProviderConfig(provider)
  return Graph({ kv: provider, kvConfig, diagnostics })
}
