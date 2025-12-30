import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { keyExists } from '../kv/kvUtils.js'

export const E = {
  [operationNameKey]: operationName.E,
  [operationResultTypeKey]: operationResultType.edge,
  [operationStreamWrapperKey]({ ctx: { kvStore } = {}, args: [idOrIds] = [] } = {}) {
    return (source) => (async function* () {
      for await (const _ of source) {
        // drain upstream to preserve traverser metadata
      }
      if (Array.isArray(idOrIds)) {
        for (const edgeId of idOrIds) {
          const exists = await keyExists(kvStore, graphKeyspace.edgesIndex.record(edgeId))
          if (exists) yield edgeId
        }
        return
      }

      if (idOrIds === undefined || idOrIds === null) {
        const keys = await kvStore.keys(graphKeyspace.edgesIndex.all())
        for await (const key of keys) {
          yield key.split('.').pop()
        }
        return
      }

      if (kvStore) {
        const exists = await keyExists(kvStore, graphKeyspace.edgesIndex.record(idOrIds))
        if (exists) yield idOrIds
      }
    })()
  },
  [operationFactoryKey]({
    ctx: { kvStore } = {},
    args: [idOrIds] = [] } = {}
  ) {
    async function* iterator() {
      if (Array.isArray(idOrIds)) {
        for (const edgeId of idOrIds) {
          const exists = await keyExists(kvStore, graphKeyspace.edgesIndex.record(edgeId))
          if (exists) yield edgeId
        }
        return
      }

      if (idOrIds === undefined || idOrIds === null) {
        const keys = await kvStore.keys(graphKeyspace.edgesIndex.all())
        for await (const key of keys) {
          yield key.split('.').pop()
        }
        return
      }

      if (kvStore) {
        const exists = await keyExists(kvStore, graphKeyspace.edgesIndex.record(idOrIds))
        if (exists) yield idOrIds
      }
    }

    return {
      [Symbol.asyncIterator]: iterator,
    }
  }
}
