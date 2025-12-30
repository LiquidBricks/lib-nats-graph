import { vertexLabel, edgeLabel } from './label.js'
import { operationFactoryKey, operationStreamWrapperKey } from '../types.js'
import { operationResultTypeKey, operationResultType, operationNameKey, operationName } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { readChunkedSet } from '../kv/kvUtils.js'

export const vertexValueMap = {
  [operationNameKey]: operationName.valueMap,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey]({ ctx: { kvStore }, args = [] } = {}) {
    return (source) => (async function* () {
      for await (const vertexId of source) {
        if (!args || args.length === 0) {
          const chunkedKeys = await readChunkedSet(kvStore, {
            metaKey: graphKeyspace.vertex.propertyKeys.meta(vertexId),
            chunkKeyForIndex: (idx) => graphKeyspace.vertex.propertyKeys.chunk(vertexId, idx),
          })
          const keys = chunkedKeys.length > 0
            ? chunkedKeys
            : await kvStore.keys(graphKeyspace.vertex.propertiesPattern(vertexId)).then(Array.fromAsync)
          const seen = new Set()
          const entries = await Promise.all(
            keys
              .map((key) => key.split('.').pop())
              .filter((name) => name && !seen.has(name) && seen.add(name))
              .map(async (name) => {
                try {
                  const d = await kvStore.get(graphKeyspace.vertex.property(vertexId, name))
                  const v = await d.json()
                  return [name, v]
                } catch {
                  return [name, undefined]
                }
              })
          )
          yield Object.fromEntries(entries)
          continue
        }

        const reqKeys = args.map(String)
        const promises = reqKeys.map(async (k) => {
          if (k === 'label') {
            const values = await Array.fromAsync(vertexLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
              (async function* () { yield vertexId })()
            ))
            return ['label', values[0]]
          }
          if (k === 'id') {
            return ['id', vertexId]
          }
          try {
            const d = await kvStore.get(graphKeyspace.vertex.property(vertexId, k))
            const v = await d.json()
            return [k, v]
          } catch {
            return [k, undefined]
          }
        })
        const entries = await Promise.all(promises)
        yield Object.fromEntries(entries)
      }
    })()
  },
  [operationFactoryKey]({ parent: vertexId, ctx: { kvStore }, args = [] } = {}) {
    async function* iterator() {
      // if no args, return all property keys and values
      if (!args || args.length === 0) {
        const chunkedKeys = await readChunkedSet(kvStore, {
          metaKey: graphKeyspace.vertex.propertyKeys.meta(vertexId),
          chunkKeyForIndex: (idx) => graphKeyspace.vertex.propertyKeys.chunk(vertexId, idx),
        })
        const keys = chunkedKeys.length > 0
          ? chunkedKeys
          : await kvStore.keys(graphKeyspace.vertex.propertiesPattern(vertexId)).then(Array.fromAsync)
        const seen = new Set()

        const entries = await Promise.all(
          keys
            .map((key) => key.split('.').pop())
            .filter((name) => name && !seen.has(name) && seen.add(name))
            .map(async (name) => {
              try {
                const d = await kvStore.get(graphKeyspace.vertex.property(vertexId, name))
                const v = await d.json()
                return [name, v]
              } catch {
                return [name, undefined]
              }
            })
        )

        yield Object.fromEntries(entries)
        return
      }

      // otherwise, only return requested keys (support 'id' and 'label')
      const reqKeys = args.map(String)
      const promises = reqKeys.map(async (k) => {
        if (k === 'label') {
          const values = await Array.fromAsync(vertexLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
            (async function* () { yield vertexId })()
          ))
          return ['label', values[0]]
        }
        if (k === 'id') {
          return ['id', vertexId]
        }

        try {
          const d = await kvStore.get(graphKeyspace.vertex.property(vertexId, k))
          const v = await d.json()
          return [k, v]
        } catch {
          return [k, undefined]
        }
      })

      const entries = await Promise.all(promises)
      yield Object.fromEntries(entries)
    }

    return {
      [Symbol.asyncIterator]: iterator
    };
  }
}

export const edgeValueMap = {
  [operationNameKey]: operationName.valueMap,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey]({ ctx: { kvStore }, args = [] } = {}) {
    return (source) => (async function* () {
      for await (const edgeId of source) {
        if (!args || args.length === 0) {
          const chunkedKeys = await readChunkedSet(kvStore, {
            metaKey: graphKeyspace.edge.propertyKeys.meta(edgeId),
            chunkKeyForIndex: (idx) => graphKeyspace.edge.propertyKeys.chunk(edgeId, idx),
          })
          const keys = chunkedKeys.length > 0
            ? chunkedKeys
            : await kvStore.keys(graphKeyspace.edge.propertiesPattern(edgeId)).then(Array.fromAsync)
          const seen = new Set()
          const entries = await Promise.all(
            keys
              .map((key) => key.split('.').pop())
              .filter((name) => name && !seen.has(name) && seen.add(name))
              .map(async (name) => {
                try {
                  const d = await kvStore.get(graphKeyspace.edge.property(edgeId, name))
                  const v = await d.json()
                  return [name, v]
                } catch {
                  return [name, undefined]
                }
              })
          )
          yield Object.fromEntries(entries)
          continue
        }

        const reqKeys = args.map(String)
        const promises = reqKeys.map(async (k) => {
          if (k === 'label') {
            const values = await Array.fromAsync(edgeLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
              (async function* () { yield edgeId })()
            ))
            return ['label', values[0]]
          }
          if (k === 'id') {
            return ['id', edgeId]
          }
          try {
            const d = await kvStore.get(graphKeyspace.edge.property(edgeId, k))
            const v = await d.json()
            return [k, v]
          } catch {
            return [k, undefined]
          }
        })
        const entries = await Promise.all(promises)
        yield Object.fromEntries(entries)
      }
    })()
  },
  [operationFactoryKey]({ parent: edgeId, ctx: { kvStore }, args = [] } = {}) {
    async function* iterator() {
      if (!args || args.length === 0) {
        const chunkedKeys = await readChunkedSet(kvStore, {
          metaKey: graphKeyspace.edge.propertyKeys.meta(edgeId),
          chunkKeyForIndex: (idx) => graphKeyspace.edge.propertyKeys.chunk(edgeId, idx),
        })
        const keys = chunkedKeys.length > 0
          ? chunkedKeys
          : await kvStore.keys(graphKeyspace.edge.propertiesPattern(edgeId)).then(Array.fromAsync)
        const seen = new Set()

        const entries = await Promise.all(
          keys
            .map((key) => key.split('.').pop())
            .filter((name) => name && !seen.has(name) && seen.add(name))
            .map(async (name) => {
              try {
                const d = await kvStore.get(graphKeyspace.edge.property(edgeId, name))
                const v = await d.json()
                return [name, v]
              } catch {
                return [name, undefined]
              }
            })
        )

        yield Object.fromEntries(entries)
        return
      }

      const reqKeys = args.map(String)
      const promises = reqKeys.map(async (k) => {
        if (k === 'label') {
          const values = await Array.fromAsync(edgeLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
            (async function* () { yield edgeId })()
          ))
          return ['label', values[0]]
        }
        if (k === 'id') {
          return ['id', edgeId]
        }

        try {
          const d = await kvStore.get(graphKeyspace.edge.property(edgeId, k))
          const v = await d.json()
          return [k, v]
        } catch {
          return [k, undefined]
        }
      })

      const entries = await Promise.all(promises)
      yield Object.fromEntries(entries)
    }

    return {
      [Symbol.asyncIterator]: iterator
    };
  }
}
