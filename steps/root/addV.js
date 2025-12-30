import { uniqueID } from '../../config.js'
import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'

export const addV = {
  [operationNameKey]: operationName.addV,
  [operationResultTypeKey]: operationResultType.vertex,
  [operationStreamWrapperKey]({ ctx: { kvStore, diagnostics } = {}, args: [label] = [] } = {}) {
    return (_source) => (async function* () {
      diagnostics?.require(typeof label === 'string' && label.length, Errors.VERTEX_LABEL_REQUIRED, 'type required', { label });

      const id = uniqueID();
      await Promise.all([
        kvStore.create(graphKeyspace.vertex.record(id), id),
        kvStore.create(graphKeyspace.vertex.label(id), label),
        kvStore.create(graphKeyspace.vertex.labelMarker(id, label), ""),
      ])
      yield id
    })()
  },
  [operationFactoryKey]({ ctx: { kvStore, diagnostics } = {}, args: [label] = [] } = {}) {
    diagnostics?.require(typeof label === 'string' && label.length, Errors.VERTEX_LABEL_REQUIRED, 'type required', { label });

    async function* itr() {
      const id = uniqueID();
      await Promise.all([
        kvStore.create(graphKeyspace.vertex.record(id), id),
        kvStore.create(graphKeyspace.vertex.label(id), label),
        kvStore.create(graphKeyspace.vertex.labelMarker(id, label), ""),
      ])
      yield id
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}
