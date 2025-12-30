import { VRef } from '../root/V.js'
import { operationFactoryKey, operationNameKey, operationName, operationResultType, operationResultTypeKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { getStringOrNull } from '../kv/kvUtils.js'

export const edgeInV = {
  [operationNameKey]: operationName.inV,
  [operationResultTypeKey]: operationResultType.vertex,
  [operationFactoryKey]({ parent, ctx = {} } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const edgeId = parent == null ? null : String(parent)
    if (!edgeId) return VRef(null)

    return {
      [Symbol.asyncIterator]: (async function* () {
        const toId = await getStringOrNull(store, graphKeyspace.edge.outgoing(edgeId))
        if (toId != null) yield toId
      })
    }
  }
}
