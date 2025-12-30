import { VRef } from '../root/V.js'
import { operationFactoryKey, operationNameKey, operationName, operationResultType, operationResultTypeKey, Errors } from '../types.js'

export const edgeOtherV = {
  [operationNameKey]: operationName.otherV,
  [operationResultTypeKey]: operationResultType.vertex,
  [operationFactoryKey]({ parent, ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const edgeId = parent == null ? null : String(parent)
    if (!edgeId) return VRef(null)

    const knownId = args.length ? (args[0] == null ? null : String(args[0])) : null
    diagnostics?.require(!!store, Errors.KVSTORE_MISSING, 'kvStore required in ctx for edgeOtherV() traversal', { where: 'shelved/edgeOtherV.factory' });

    return {
      [Symbol.asyncIterator]: (async function* () {
        let incoming = null
        let outgoing = null

        try {
          incoming = await store.get(`edge.${edgeId}.incoming`).then((d) => d.string())
        } catch {
          incoming = null
        }

        try {
          outgoing = await store.get(`edge.${edgeId}.outgoing`).then((d) => d.string())
        } catch {
          outgoing = null
        }

        if (knownId && incoming === knownId && outgoing) {
          if (outgoing != null) yield outgoing
          return
        }
        if (knownId && outgoing === knownId && incoming) {
          if (incoming != null) yield incoming
          return
        }
        if (outgoing) {
          if (outgoing != null) yield outgoing
          return
        }
        if (incoming) {
          if (incoming != null) yield incoming
          return
        }
      })
    }
  }
}
