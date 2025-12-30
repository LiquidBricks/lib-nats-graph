
import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { getStringOrNull, removeFromJsonArray, removeFromChunkedSet } from '../kv/kvUtils.js'

// Internal helper to remove an edge and all its indices/adjacency entries
const dropEdgeById = async (kvStore, edgeId) => {
  const incoming = await getStringOrNull(kvStore, graphKeyspace.edge.incoming(edgeId))
  const outgoing = await getStringOrNull(kvStore, graphKeyspace.edge.outgoing(edgeId))
  const label = await getStringOrNull(kvStore, graphKeyspace.edge.label(edgeId))

  await kvStore.delete(graphKeyspace.edge.record(edgeId)).catch(() => { })

  const edgeKeys = await kvStore.keys(graphKeyspace.edge.descendantsPattern(edgeId)).catch(() => [])
  for await (const key of edgeKeys) {
    await kvStore.delete(key).catch(() => { })
  }

  if (incoming) {
    await kvStore.delete(graphKeyspace.vertex.outE.key(incoming, edgeId)).catch(() => { })
    if (label) await kvStore.delete(graphKeyspace.vertex.outE.keyByLabel(incoming, label, edgeId)).catch(() => { })
    await removeFromJsonArray(kvStore, graphKeyspace.vertex.outE.index(incoming), edgeId)
    if (label) await removeFromJsonArray(kvStore, graphKeyspace.vertex.outE.indexByLabel(incoming, label), edgeId)
    await removeFromChunkedSet(kvStore, {
      metaKey: graphKeyspace.adj.outE.meta(incoming),
      chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.chunk(incoming, idx),
      value: edgeId,
    })
    if (label) {
      await removeFromChunkedSet(kvStore, {
        metaKey: graphKeyspace.adj.outE.labelMeta(incoming, label),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.outE.labelChunk(incoming, label, idx),
        value: edgeId,
      })
    }
    if (outgoing) {
      await removeFromJsonArray(kvStore, graphKeyspace.vertex.outV.index(incoming), outgoing)
      if (label) await removeFromJsonArray(kvStore, graphKeyspace.vertex.outV.indexByLabel(incoming, label), outgoing)
      await removeFromChunkedSet(kvStore, {
        metaKey: graphKeyspace.adj.outV.meta(incoming),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.chunk(incoming, idx),
        value: outgoing,
      })
      if (label) {
        await removeFromChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.outV.labelMeta(incoming, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.labelChunk(incoming, label, idx),
          value: outgoing,
        })
      }
    }
  }

  if (outgoing) {
    await kvStore.delete(graphKeyspace.vertex.inE.key(outgoing, edgeId)).catch(() => { })
    if (label) await kvStore.delete(graphKeyspace.vertex.inE.keyByLabel(outgoing, label, edgeId)).catch(() => { })
    await removeFromJsonArray(kvStore, graphKeyspace.vertex.inE.index(outgoing), edgeId)
    if (label) await removeFromJsonArray(kvStore, graphKeyspace.vertex.inE.indexByLabel(outgoing, label), edgeId)
    await removeFromChunkedSet(kvStore, {
      metaKey: graphKeyspace.adj.inE.meta(outgoing),
      chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.chunk(outgoing, idx),
      value: edgeId,
    })
    if (label) {
      await removeFromChunkedSet(kvStore, {
        metaKey: graphKeyspace.adj.inE.labelMeta(outgoing, label),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.labelChunk(outgoing, label, idx),
        value: edgeId,
      })
    }
    if (incoming) {
      await removeFromJsonArray(kvStore, graphKeyspace.vertex.inV.index(outgoing), incoming)
      if (label) await removeFromJsonArray(kvStore, graphKeyspace.vertex.inV.indexByLabel(outgoing, label), incoming)
      await removeFromChunkedSet(kvStore, {
        metaKey: graphKeyspace.adj.inV.meta(outgoing),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.chunk(outgoing, idx),
        value: incoming,
      })
      if (label) {
        await removeFromChunkedSet(kvStore, {
          metaKey: graphKeyspace.adj.inV.labelMeta(outgoing, label),
          chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.labelChunk(outgoing, label, idx),
          value: incoming,
        })
      }
    }
  }

  await kvStore.delete(graphKeyspace.edgesIndex.record(edgeId)).catch(() => { })

  return { incoming, outgoing, label }
}

export const dropGraph = {
  [operationNameKey]: operationName.drop,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey]({ ctx: { kvStore } = {} } = {}) {
    return (_source) => (async function* () {
      const deleteByPattern = async (pattern) => {
        const keys = await kvStore.keys(pattern)
        for await (const key of keys) {
          await kvStore.delete(key)
        }
      }
      await Promise.all([
        deleteByPattern(graphKeyspace.vertex.allDeep()),
        deleteByPattern(graphKeyspace.edge.allDeep()),
        deleteByPattern(graphKeyspace.edgesIndex.allDeep()),
        deleteByPattern(graphKeyspace.adj.all()),
      ])
    })()
  },
  [operationFactoryKey]({ ctx: { kvStore } = {} } = {}) {
    async function* itr() {
      const deleteByPattern = async (pattern) => {
        const keys = await kvStore.keys(pattern)
        for await (const key of keys) {
          await kvStore.delete(key)
        }
      }
      await Promise.all([
        deleteByPattern(graphKeyspace.vertex.allDeep()),
        deleteByPattern(graphKeyspace.edge.allDeep()),
        deleteByPattern(graphKeyspace.edgesIndex.allDeep()),
        deleteByPattern(graphKeyspace.adj.all()),
      ])
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}

export const dropVertex = {
  [operationNameKey]: operationName.drop,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey]({ ctx: { kvStore } = {} } = {}) {
    return (source) => (async function* () {
      for await (const vertexId of source) {
        const incident = new Set()

        // Gather incident edge IDs from indices (fast path)
        const loadIndex = async (key) => {
          const raw = await kvStore.get(key).then((d) => d.string()).catch(() => '[]')
          try {
            const arr = JSON.parse(raw || '[]')
            if (Array.isArray(arr)) arr.forEach((id) => incident.add(String(id)))
          } catch { }
        }
        await Promise.all([
          loadIndex(graphKeyspace.vertex.outE.index(vertexId)),
          loadIndex(graphKeyspace.vertex.inE.index(vertexId))
        ])

        // If indices are missing, fall back to scanning keys
        if (incident.size === 0) {
          const outKeys = await kvStore.keys(graphKeyspace.vertex.outE.scanFallbackPattern(vertexId)).catch(() => [])
          for await (const key of outKeys) {
            const tail = key.split('.').pop()
            if (tail && tail !== '__index') incident.add(tail)
          }
          const inKeys = await kvStore.keys(graphKeyspace.vertex.inE.scanFallbackPattern(vertexId)).catch(() => [])
          for await (const key of inKeys) {
            const tail = key.split('.').pop()
            if (tail && tail !== '__index') incident.add(tail)
          }
        }

        // Track neighbor adjacency to clean up boolean outV/inV keys on neighbors
        const neighborAdjDeletes = new Set()

        for (const edgeId of incident) {
          const { incoming, outgoing, label } = await dropEdgeById(kvStore, edgeId)
          if (incoming === vertexId && outgoing) {
            // Remove neighbor's inV reference to this vertex
            neighborAdjDeletes.add(JSON.stringify({ side: 'inV', neighbor: outgoing, label: label || '', me: vertexId }))
          }
          if (outgoing === vertexId && incoming) {
            // Remove neighbor's outV reference to this vertex
            neighborAdjDeletes.add(JSON.stringify({ side: 'outV', neighbor: incoming, label: label || '', me: vertexId }))
          }
        }

        for (const item of neighborAdjDeletes) {
          const { side, neighbor, label, me } = JSON.parse(item)
          if (side === 'inV') {
            await kvStore.delete(graphKeyspace.vertex.inV.key(neighbor, me)).catch(() => { })
            if (label) await kvStore.delete(graphKeyspace.vertex.inV.keyByLabel(neighbor, label, me)).catch(() => { })
          } else {
            await kvStore.delete(graphKeyspace.vertex.outV.key(neighbor, me)).catch(() => { })
            if (label) await kvStore.delete(graphKeyspace.vertex.outV.keyByLabel(neighbor, label, me)).catch(() => { })
          }
        }

        // Finally remove the vertex and all its keys
        await kvStore.delete(graphKeyspace.vertex.record(vertexId)).catch(() => { })
        const nodeKeys = await kvStore.keys(graphKeyspace.vertex.descendantsPattern(vertexId)).catch(() => [])
        for await (const key of nodeKeys) {
          await kvStore.delete(key).catch(() => { })
        }
        const adjOutKeys = await kvStore.keys(graphKeyspace.adj.outV.allForVertex(vertexId)).catch(() => [])
        for await (const key of adjOutKeys) {
          await kvStore.delete(key).catch(() => { })
        }
        const adjOutEKeys = await kvStore.keys(graphKeyspace.adj.outE.allForVertex(vertexId)).catch(() => [])
        for await (const key of adjOutEKeys) {
          await kvStore.delete(key).catch(() => { })
        }
        const adjInKeys = await kvStore.keys(graphKeyspace.adj.inV.allForVertex(vertexId)).catch(() => [])
        for await (const key of adjInKeys) {
          await kvStore.delete(key).catch(() => { })
        }
        const adjInEKeys = await kvStore.keys(graphKeyspace.adj.inE.allForVertex(vertexId)).catch(() => [])
        for await (const key of adjInEKeys) {
          await kvStore.delete(key).catch(() => { })
        }
      }
    })()
  },
  [operationFactoryKey]({ parent: vertexId, ctx: { kvStore } = {} } = {}) {
    async function* iterator() {
      const incident = new Set()

      const loadIndex = async (key) => {
        const raw = await kvStore.get(key).then((d) => d.string()).catch(() => '[]')
        try {
          const arr = JSON.parse(raw || '[]')
          if (Array.isArray(arr)) arr.forEach((id) => incident.add(String(id)))
        } catch { }
      }
      await Promise.all([
        loadIndex(graphKeyspace.vertex.outE.index(vertexId)),
        loadIndex(graphKeyspace.vertex.inE.index(vertexId))
      ])

      if (incident.size === 0) {
        const outKeys = await kvStore.keys(graphKeyspace.vertex.outE.scanFallbackPattern(vertexId)).catch(() => [])
        for await (const key of outKeys) {
          const tail = key.split('.').pop()
          if (tail && tail !== '__index') incident.add(tail)
        }
        const inKeys = await kvStore.keys(graphKeyspace.vertex.inE.scanFallbackPattern(vertexId)).catch(() => [])
        for await (const key of inKeys) {
          const tail = key.split('.').pop()
          if (tail && tail !== '__index') incident.add(tail)
        }
      }

      const neighborAdjDeletes = new Set()
      for (const edgeId of incident) {
        const { incoming, outgoing, label } = await dropEdgeById(kvStore, edgeId)
        if (incoming === vertexId && outgoing) {
          neighborAdjDeletes.add(JSON.stringify({ side: 'inV', neighbor: outgoing, label: label || '', me: vertexId }))
        }
        if (outgoing === vertexId && incoming) {
          neighborAdjDeletes.add(JSON.stringify({ side: 'outV', neighbor: incoming, label: label || '', me: vertexId }))
        }
      }

      for (const item of neighborAdjDeletes) {
        const { side, neighbor, label, me } = JSON.parse(item)
        if (side === 'inV') {
          await kvStore.delete(graphKeyspace.vertex.inV.key(neighbor, me)).catch(() => { })
          if (label) await kvStore.delete(graphKeyspace.vertex.inV.keyByLabel(neighbor, label, me)).catch(() => { })
        } else {
          await kvStore.delete(graphKeyspace.vertex.outV.key(neighbor, me)).catch(() => { })
          if (label) await kvStore.delete(graphKeyspace.vertex.outV.keyByLabel(neighbor, label, me)).catch(() => { })
        }
      }

      await kvStore.delete(graphKeyspace.vertex.record(vertexId)).catch(() => { })
      const nodeKeys = await kvStore.keys(graphKeyspace.vertex.descendantsPattern(vertexId)).catch(() => [])
      for await (const key of nodeKeys) {
        await kvStore.delete(key).catch(() => { })
      }
      const adjOutKeys = await kvStore.keys(graphKeyspace.adj.outV.allForVertex(vertexId)).catch(() => [])
      for await (const key of adjOutKeys) {
        await kvStore.delete(key).catch(() => { })
      }
      const adjOutEKeys = await kvStore.keys(graphKeyspace.adj.outE.allForVertex(vertexId)).catch(() => [])
      for await (const key of adjOutEKeys) {
        await kvStore.delete(key).catch(() => { })
      }
      const adjInKeys = await kvStore.keys(graphKeyspace.adj.inV.allForVertex(vertexId)).catch(() => [])
      for await (const key of adjInKeys) {
        await kvStore.delete(key).catch(() => { })
      }
      const adjInEKeys = await kvStore.keys(graphKeyspace.adj.inE.allForVertex(vertexId)).catch(() => [])
      for await (const key of adjInEKeys) {
        await kvStore.delete(key).catch(() => { })
      }
    }

    return { [Symbol.asyncIterator]: iterator }
  }
}

export const dropEdge = {
  [operationNameKey]: operationName.drop,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey]({ ctx: { kvStore } = {} } = {}) {
    return (source) => (async function* () {
      for await (const edgeId of source) {
        await dropEdgeById(kvStore, edgeId)
      }
    })()
  },
  [operationFactoryKey]({ parent: edgeId, ctx: { kvStore } = {} } = {}) {
    async function* itr() {
      await dropEdgeById(kvStore, edgeId)
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}
