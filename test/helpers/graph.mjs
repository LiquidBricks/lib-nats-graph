import { Graph } from '../../graph/graph.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'

export async function setupGraph(t, options = {}) {
  const graph = Graph({
    kv: 'memory',
    diagnostics: createDiagnostics(),
    ...options,
  })
  t?.after?.(async () => graph.close?.())
  return graph
}
