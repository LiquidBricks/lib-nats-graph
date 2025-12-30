import { Graph } from '../../graph/graph.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'
import { ulid } from 'ulid'
import { NATS_IP_ADDRESS } from '../util/config.js'

export function makeSetup(kv) {
  return async function setup(t, options = {}) {
    const diagnostics = createDiagnostics()
    let kvConfig = options.kvConfig
    if (kv === 'nats') {
      if (!NATS_IP_ADDRESS) throw new Error('NATS_IP_ADDRESS missing; set in test/.env')
      kvConfig = { servers: NATS_IP_ADDRESS, bucket: `testing-${ulid()}` }
    }
    const graph = Graph({ kv, kvConfig, diagnostics, ...options })
    t?.after?.(async () => graph.close?.())
    return graph
  }
}
