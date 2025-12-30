import { operationResultTypeKey, operationFactoryKey, operationResultType as sharedElementType, operationNameKey, operationName, operationStreamWrapperKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { appendToChunkedSet } from '../kv/kvUtils.js'

export const vertexPropertyStep = {
  [operationNameKey]: operationName.property,
  [operationResultTypeKey]: sharedElementType.vertex,
  [operationStreamWrapperKey]({ ctx: { kvStore, diagnostics }, args: [k, v] } = {}) {
    diagnostics?.require(typeof k === 'string' && k.length > 0, Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires string key', { key: k });
    diagnostics?.require(!['id', 'label'].includes(k), Errors.PROPERTY_RESERVED_KEY, `Reserved key. Property ${k} not allowed.`, { key: k });
    const t = typeof v; diagnostics?.require(v !== undefined && (t === 'string' || t === 'number' || t === 'boolean' || t === 'object'), Errors.PROPERTY_INVALID_VALUE, 'Invalid value type for property()', { value: v, type: t });
    return (source) => (async function* () {
      for await (const vertexId of source) {
        await kvStore.update(graphKeyspace.vertex.property(vertexId, k), JSON.stringify(v));
        await appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.vertex.propertyKeys.meta(vertexId),
          chunkKeyForIndex: (idx) => graphKeyspace.vertex.propertyKeys.chunk(vertexId, idx),
          value: k,
        });
        yield vertexId;
      }
    })()
  },
  [operationFactoryKey]({ parent: vertexId, ctx: { kvStore, diagnostics }, args: [k, v] } = {}) {
    // Preconditions and validation
    diagnostics?.require(typeof k === 'string', Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires string key', { key: k });
    diagnostics?.require(k.length > 0, Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires non-empty key', { key: k });
    diagnostics?.require(!['id', 'label'].includes(k), Errors.PROPERTY_RESERVED_KEY, `Reserved key. Property ${k} not allowed.`, { key: k });
    const t = typeof v;
    diagnostics?.require(v !== undefined && (t === 'string' || t === 'number' || t === 'boolean' || t === 'object'), Errors.PROPERTY_INVALID_VALUE, 'Invalid value type for property()', { value: v, type: t });
    async function* itr() {
      await kvStore.update(graphKeyspace.vertex.property(vertexId, k), JSON.stringify(v));
      await appendToChunkedSet(kvStore, {
        metaKey: graphKeyspace.vertex.propertyKeys.meta(vertexId),
        chunkKeyForIndex: (idx) => graphKeyspace.vertex.propertyKeys.chunk(vertexId, idx),
        value: k,
      });
      yield vertexId;
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
};

export const edgePropertyStep = {
  [operationNameKey]: operationName.property,
  [operationResultTypeKey]: sharedElementType.edge,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { kvStore, diagnostics } = ctx;
    const [k, v] = args;
    diagnostics?.require(typeof k === 'string' && k.length > 0, Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires string key', { key: k });
    diagnostics?.require(!['id', 'label'].includes(k), Errors.PROPERTY_RESERVED_KEY, `Reserved key. Property ${k} not allowed.`, { key: k });
    const t = typeof v; diagnostics?.require(v !== undefined && (t === 'string' || t === 'number' || t === 'boolean' || t === 'object'), Errors.PROPERTY_INVALID_VALUE, 'Invalid value type for property()', { value: v, type: t });
    return (source) => (async function* () {
      for await (const edgeId of source) {
        await kvStore.update(graphKeyspace.edge.property(edgeId, k), JSON.stringify(v));
        await appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.edge.propertyKeys.meta(edgeId),
          chunkKeyForIndex: (idx) => graphKeyspace.edge.propertyKeys.chunk(edgeId, idx),
          value: k,
        });
        yield edgeId;
      }
    })()
  },
  [operationFactoryKey]({ parent: edgeId, ctx: { kvStore, diagnostics }, args: [k, v] } = {}) {
    // Preconditions and validation
    diagnostics?.require(typeof k === 'string', Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires string key', { key: k });
    diagnostics?.require(k.length > 0, Errors.PROPERTY_INVALID_KEY, 'property(key, value) requires non-empty key', { key: k });
    diagnostics?.require(!['id', 'label'].includes(k), Errors.PROPERTY_RESERVED_KEY, `Reserved key. Property ${k} not allowed.`, { key: k });
    const t = typeof v;
    diagnostics?.require(v !== undefined && (t === 'string' || t === 'number' || t === 'boolean' || t === 'object'), Errors.PROPERTY_INVALID_VALUE, 'Invalid value type for property()', { value: v, type: t });
    async function* iterator() {
      await kvStore.update(graphKeyspace.edge.property(edgeId, k), JSON.stringify(v));
      await appendToChunkedSet(kvStore, {
        metaKey: graphKeyspace.edge.propertyKeys.meta(edgeId),
        chunkKeyForIndex: (idx) => graphKeyspace.edge.propertyKeys.chunk(edgeId, idx),
        value: k,
      });
      yield edgeId;
    }

    return {
      [Symbol.asyncIterator]: iterator,
    };
  }
}
