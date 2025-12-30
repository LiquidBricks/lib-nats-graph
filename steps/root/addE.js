import { uniqueID } from '../../config.js'
import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { keyExists, pushUniqueToJsonArray, appendToChunkedSet } from '../kv/kvUtils.js'

export const addE = {
  [operationNameKey]: operationName.addE,
  [operationResultTypeKey]: operationResultType.edge,
  [operationStreamWrapperKey]({
    ctx: { kvStore, diagnostics } = {},
    args: [label, incoming, outgoing] = []
  } = {}) {
    return (_source) => (async function* () {
      diagnostics?.require(typeof label === 'string' && label.length, Errors.EDGE_LABEL_REQUIRED, 'type required', { label });
      diagnostics?.require(typeof incoming === 'string' && incoming.length, Errors.EDGE_INCOMING_REQUIRED, 'incoming required', { incoming });
      diagnostics?.require(typeof outgoing === 'string' && outgoing.length, Errors.EDGE_OUTGOING_REQUIRED, 'outgoing required', { outgoing });

      const [inExists, outExists] = await Promise.all([
        keyExists(kvStore, graphKeyspace.vertex.record(incoming)),
        keyExists(kvStore, graphKeyspace.vertex.record(outgoing)),
      ])
      diagnostics?.require(inExists, Errors.EDGE_INCOMING_MISSING, `incoming vertex does not exist: ${incoming}`, { incoming });
      diagnostics?.require(outExists, Errors.EDGE_OUTGOING_MISSING, `outgoing vertex does not exist: ${outgoing}`, { outgoing });

      const id = uniqueID();
      await Promise.all([
        kvStore.create(graphKeyspace.edge.record(id), ""),
        kvStore.create(graphKeyspace.edge.label(id), label),
        kvStore.create(graphKeyspace.edge.incoming(id), incoming),
        kvStore.create(graphKeyspace.edge.outgoing(id), outgoing),
        kvStore.create(graphKeyspace.vertex.outE.key(incoming, id), ""),
        kvStore.create(graphKeyspace.vertex.outE.keyByLabel(incoming, label, id), ""),
        kvStore.create(graphKeyspace.vertex.inE.key(outgoing, id), ""),
        kvStore.create(graphKeyspace.vertex.inE.keyByLabel(outgoing, label, id), ""),
        kvStore.put(graphKeyspace.vertex.outV.key(incoming, outgoing), ""),
        kvStore.put(graphKeyspace.vertex.outV.keyByLabel(incoming, label, outgoing), ""),
        kvStore.put(graphKeyspace.vertex.inV.key(outgoing, incoming), ""),
        kvStore.put(graphKeyspace.vertex.inV.keyByLabel(outgoing, label, incoming), ""),

        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outE.index(incoming), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outE.indexByLabel(incoming, label), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inE.index(outgoing), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inE.indexByLabel(outgoing, label), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outV.index(incoming), outgoing),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outV.indexByLabel(incoming, label), outgoing),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inV.index(outgoing), incoming),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inV.indexByLabel(outgoing, label), incoming),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outV.meta(incoming),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.chunk(incoming, idx),
          value: outgoing,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outV.labelMeta(incoming, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.labelChunk(incoming, label, idx),
          value: outgoing,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outE.meta(incoming),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.chunk(incoming, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outE.labelMeta(incoming, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.labelChunk(incoming, label, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inV.meta(outgoing),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.chunk(outgoing, idx),
          value: incoming,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inV.labelMeta(outgoing, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.labelChunk(outgoing, label, idx),
          value: incoming,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inE.meta(outgoing),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.chunk(outgoing, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inE.labelMeta(outgoing, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.labelChunk(outgoing, label, idx),
          value: id,
        }),
      ]);

      try { await kvStore.create(graphKeyspace.edgesIndex.record(id), "") } catch { }
      yield id;
    })()
  },
  [operationFactoryKey]({
    ctx: { kvStore, diagnostics } = {},
    args: [label, incoming, outgoing] } = {}
  ) {
    diagnostics?.require(typeof label === 'string' && label.length, Errors.EDGE_LABEL_REQUIRED, 'type required', { label });
    diagnostics?.require(typeof incoming === 'string' && incoming.length, Errors.EDGE_INCOMING_REQUIRED, 'incoming required', { incoming });
    diagnostics?.require(typeof outgoing === 'string' && outgoing.length, Errors.EDGE_OUTGOING_REQUIRED, 'outgoing required', { outgoing });

    async function* itr() {
      // Ensure both endpoint vertices exist before creating the edge
      const [inExists, outExists] = await Promise.all([
        keyExists(kvStore, graphKeyspace.vertex.record(incoming)),
        keyExists(kvStore, graphKeyspace.vertex.record(outgoing)),
      ])
      diagnostics?.require(inExists, Errors.EDGE_INCOMING_MISSING, `incoming vertex does not exist: ${incoming}`, { incoming });
      diagnostics?.require(outExists, Errors.EDGE_OUTGOING_MISSING, `outgoing vertex does not exist: ${outgoing}`, { outgoing });

      const id = uniqueID();
      await Promise.all([
        kvStore.create(graphKeyspace.edge.record(id), ""),
        kvStore.create(graphKeyspace.edge.label(id), label),
        kvStore.create(graphKeyspace.edge.incoming(id), incoming),
        kvStore.create(graphKeyspace.edge.outgoing(id), outgoing),
        // Index for V(id).outE(): fast lookup of outgoing edges by vertex and label
        // Generic index (no label filter)
        kvStore.create(graphKeyspace.vertex.outE.key(incoming, id), ""),
        // Label-specific index for targeted scans: node.<vertex>.outE.<label>.<edge>
        kvStore.create(graphKeyspace.vertex.outE.keyByLabel(incoming, label, id), ""),
        // Index for V(id).inE(): fast lookup of incoming edges by vertex and label
        kvStore.create(graphKeyspace.vertex.inE.key(outgoing, id), ""),
        kvStore.create(graphKeyspace.vertex.inE.keyByLabel(outgoing, label, id), ""),
        // Adjacency: vertex -> neighbor vertices (out and in), with label scoping
        // These keys are idempotent per vertex pair, so use put() to avoid
        // duplicate-key errors when multiple edges connect the same vertices.
        kvStore.put(graphKeyspace.vertex.outV.key(incoming, outgoing), ""),
        kvStore.put(graphKeyspace.vertex.outV.keyByLabel(incoming, label, outgoing), ""),
        kvStore.put(graphKeyspace.vertex.inV.key(outgoing, incoming), ""),
        kvStore.put(graphKeyspace.vertex.inV.keyByLabel(outgoing, label, incoming), ""),

        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outE.index(incoming), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outE.indexByLabel(incoming, label), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inE.index(outgoing), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inE.indexByLabel(outgoing, label), id),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outV.index(incoming), outgoing),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.outV.indexByLabel(incoming, label), outgoing),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inV.index(outgoing), incoming),
        pushUniqueToJsonArray(kvStore, graphKeyspace.vertex.inV.indexByLabel(outgoing, label), incoming),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outV.meta(incoming),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.chunk(incoming, idx),
          value: outgoing,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outV.labelMeta(incoming, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.labelChunk(incoming, label, idx),
          value: outgoing,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outE.meta(incoming),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.chunk(incoming, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outE.labelMeta(incoming, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.labelChunk(incoming, label, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inV.meta(outgoing),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.chunk(outgoing, idx),
          value: incoming,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inV.labelMeta(outgoing, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.labelChunk(outgoing, label, idx),
          value: incoming,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inE.meta(outgoing),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.chunk(outgoing, idx),
          value: id,
        }),
        appendToChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inE.labelMeta(outgoing, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.labelChunk(outgoing, label, idx),
          value: id,
        }),
      ]);

      // Global edge index for fast E() iteration
      try { await kvStore.create(graphKeyspace.edgesIndex.record(id), "") } catch { }
      yield id;
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}
