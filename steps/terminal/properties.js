import {
  operationResultTypeKey,
  operationFactoryKey,
  operationResultType,
  operationNameKey,
  operationName,
  operationStreamWrapperKey
} from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'

async function readProperties(elementId, kvStore, keys, propertyKey, resolvers) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return {}
  }

  const requested = keys.map(String)
  const entries = await Promise.all(requested.map(async (key) => {
    const resolver = resolvers[key]
    if (resolver) {
      try {
        return [key, await resolver({ elementId, kvStore })]
      } catch {
        return [key, undefined]
      }
    }

    try {
      const data = await kvStore.get(propertyKey(elementId, key))
      const value = await data.json()
      return [key, value]
    } catch {
      return [key, undefined]
    }
  }))

  return Object.fromEntries(entries)
}

function createPropertiesStep({ propertyKey, resolvers }) {
  return {
    [operationNameKey]: operationName.properties,
    [operationResultTypeKey]: operationResultType.value,
    [operationStreamWrapperKey]({ ctx: { kvStore } = {}, args = [] } = {}) {
      return (source) => (async function* () {
        for await (const elementId of source) {
          yield await readProperties(elementId, kvStore, args, propertyKey, resolvers)
        }
      })()
    },
    [operationFactoryKey]({ parent, ctx: { kvStore } = {}, args = [] } = {}) {
      async function* iterator() {
        yield await readProperties(parent, kvStore, args, propertyKey, resolvers)
      }

      return {
        [Symbol.asyncIterator]: iterator
      }
    }
  }
}

const vertexResolvers = {
  id: async ({ elementId }) => elementId,
  label: async ({ elementId, kvStore }) => {
    const data = await kvStore.get(graphKeyspace.vertex.label(elementId))
    return data.string()
  }
}

const edgeResolvers = {
  id: async ({ elementId }) => elementId,
  label: async ({ elementId, kvStore }) => {
    const data = await kvStore.get(graphKeyspace.edge.label(elementId))
    return data.string()
  }
}

export const vertexProperties = createPropertiesStep({
  propertyKey: graphKeyspace.vertex.property,
  resolvers: vertexResolvers
})

export const edgeProperties = createPropertiesStep({
  propertyKey: graphKeyspace.edge.property,
  resolvers: edgeResolvers
})
