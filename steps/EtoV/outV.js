import { VRef } from '../root/V.js'
import { operationFactoryKey, operationNameKey, operationName, operationResultType, operationResultTypeKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { getStringOrNull } from '../kv/kvUtils.js'

export const edgeOutV = {
  [operationNameKey]: operationName.outV,
  [operationResultTypeKey]: operationResultType.vertex,
  [operationFactoryKey]({ parent, ctx = {} } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const edgeId = parent == null ? null : String(parent)
    if (!edgeId) return VRef(null)

    return {
      [Symbol.asyncIterator]: (async function* () {
        const fromId = await getStringOrNull(store, graphKeyspace.edge.incoming(edgeId))
        if (fromId != null) yield fromId
      })
    }
  }
}
