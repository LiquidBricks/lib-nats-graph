import { vertexLabel, edgeLabel } from '../terminal/label.js'
import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'


export const vertexHas = {
  [operationNameKey]: operationName.has,
  [operationResultTypeKey]: operationResultType.vertex,
  [operationStreamWrapperKey]({ ctx: { kvStore, diagnostics } = {}, args: [key, expected] } = {}) {
    return (source) => (async function* () {
      diagnostics?.require(typeof key === 'string' && key.length > 0, Errors.HAS_INVALID_KEY, 'has(key, value) requires string, non-empty key', { key });
      const t = typeof expected;
      diagnostics?.require(t === 'string' || t === 'number' || t === 'boolean', Errors.HAS_INVALID_VALUE, 'has(key, value) requires scalar value (string|number|boolean)', { expected, type: t });

      for await (const vertexId of source) {
        let getValue;
        if (key === 'label') {
          const [value] = await Array.fromAsync(vertexLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
            (async function* () { yield vertexId })()
          ))
          getValue = value
        } else if (key === 'id') {
          getValue = vertexId
        } else {
          getValue = await kvStore.get(graphKeyspace.vertex.property(vertexId, key)).then(kvValue => kvValue?.json())
        }
        if (getValue === expected) yield vertexId
      }
    })()
  },
  [operationFactoryKey]({ parent: vertexId, ctx: { kvStore, diagnostics } = {}, args: [key, expected] } = {}) {
    // Validate inputs early so invalid usage surfaces clearly
    diagnostics?.require(typeof key === 'string', Errors.HAS_INVALID_KEY, 'has(key, value) requires string key', { key });
    diagnostics?.require(key.length > 0, Errors.HAS_INVALID_KEY, 'has(key, value) requires non-empty key', { key });
    const expectedType = typeof expected;
    diagnostics?.require(expectedType === 'string' || expectedType === 'number' || expectedType === 'boolean', Errors.HAS_INVALID_VALUE, 'has(key, value) requires scalar value (string|number|boolean)', { expected, type: expectedType });
    async function* iterator() {
      let getValue;
      if (key === 'label') {
        getValue = Array.fromAsync(vertexLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
          (async function* () { yield vertexId })()
        )).then(([value]) => value)
      } else if (key === 'id') {
        getValue = vertexId
      } else {
        getValue = kvStore.get(graphKeyspace.vertex.property(vertexId, key))
          .then(kvValue => kvValue?.json())
      }
      const isSame = (await getValue) === expected

      if (isSame) yield vertexId
    }

    return {
      [Symbol.asyncIterator]: iterator,
    }
  }
}

export const edgeHas = {
  [operationNameKey]: operationName.has,
  [operationResultTypeKey]: operationResultType.edge,
  [operationStreamWrapperKey]({ ctx: { kvStore, diagnostics } = {}, args = [] } = {}) {
    return (source) => (async function* () {
      const [key, expected] = args;
      diagnostics?.require(typeof key === 'string' && key.length > 0, Errors.HAS_INVALID_KEY, 'has(key, value) requires string, non-empty key', { key });
      const t = typeof expected;
      diagnostics?.require(t === 'string' || t === 'number' || t === 'boolean', Errors.HAS_INVALID_VALUE, 'has(key, value) requires scalar value (string|number|boolean)', { expected, type: t });

      for await (const edgeId of source) {
        let getValue;
        if (key === 'label') {
          const [value] = await Array.fromAsync(edgeLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
            (async function* () { yield edgeId })()
          ))
          getValue = value
        } else if (key === 'id') {
          getValue = edgeId
        } else {
          getValue = await kvStore.get(graphKeyspace.edge.property(edgeId, key)).then(kvValue => kvValue?.json())
        }
        if (getValue === expected) yield edgeId
      }
    })()
  },
  [operationFactoryKey]({ parent: edgeId, ctx: { kvStore, diagnostics } = {}, args: [key, expected] } = {}) {
    // Validate inputs early so invalid usage surfaces clearly
    diagnostics?.require(typeof key === 'string', Errors.HAS_INVALID_KEY, 'has(key, value) requires string key', { key });
    diagnostics?.require(key.length > 0, Errors.HAS_INVALID_KEY, 'has(key, value) requires non-empty key', { key });
    const expectedType = typeof expected;
    diagnostics?.require(expectedType === 'string' || expectedType === 'number' || expectedType === 'boolean', Errors.HAS_INVALID_VALUE, 'has(key, value) requires scalar value (string|number|boolean)', { expected, type: expectedType });
    async function* iterator() {
      let getValue;
      if (key === 'label') {
        getValue = Array.fromAsync(edgeLabel[operationStreamWrapperKey]({ ctx: { kvStore } })(
          (async function* () { yield edgeId })()
        )).then(([value]) => value)
      } else if (key === 'id') {
        getValue = edgeId
      } else {
        getValue = kvStore.get(graphKeyspace.edge.property(edgeId, key))
          .then(kvValue => kvValue?.json())
      }
      const isSame = (await getValue) === expected

      if (isSame) yield edgeId
    }

    return {
      [Symbol.asyncIterator]: iterator,
    }
  }
}
