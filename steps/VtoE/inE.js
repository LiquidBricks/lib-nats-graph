import { operationFactoryKey, operationNameKey, operationName, operationResultType, operationResultTypeKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { readChunkedSet } from '../kv/kvUtils.js'

const normalizeLabels = (args) => {
  if (!Array.isArray(args)) return []
  return args
    .filter((label) => label != null && label !== '')
    .map((label) => String(label))
}

const collectEdgeIds = async ({ store, vertexId, labels = [], dedupe }) => {
  const ids = new Set()

  if (labels.length > 0) {
    for (const label of labels) {
      const edges = await readChunkedSet(store, {
        metaKey: graphKeyspace.adj.inE.labelMeta(vertexId, label),
        chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.labelChunk(vertexId, label, idx),
      })
      const sources = edges.length > 0
        ? edges
        : await (async () => {
          const keys = await store.keys(graphKeyspace.vertex.inE.patternByLabel(vertexId, label)).catch(() => [])
          const acc = []
          for await (const key of keys) {
            const edgeId = key.split('.').pop()
            if (edgeId && edgeId !== '__index') acc.push(edgeId)
          }
          return acc
        })()

      for (const edgeId of sources) {
        if (!edgeId || edgeId === '__index') continue
        if (dedupe?.has(edgeId)) continue
        ids.add(edgeId)
        dedupe?.add(edgeId)
      }
    }
  } else {
    const edges = await readChunkedSet(store, {
      metaKey: graphKeyspace.adj.inE.meta(vertexId),
      chunkKeyForIndex: (idx) => graphKeyspace.adj.inE.chunk(vertexId, idx),
    })
    const sources = edges.length > 0
      ? edges
      : await (async () => {
        const keys = await store.keys(graphKeyspace.vertex.inE.pattern(vertexId)).catch(() => [])
        const acc = []
        for await (const key of keys) {
          const edgeId = key.split('.').pop()
          if (edgeId && edgeId !== '__index') acc.push(edgeId)
        }
        return acc
      })()

    for (const edgeId of sources) {
      if (!edgeId || edgeId === '__index') continue
      if (dedupe?.has(edgeId)) continue
      ids.add(edgeId)
      dedupe?.add(edgeId)
    }
  }

  return ids
}

export const inE = {
  [operationNameKey]: operationName.inE,
  [operationResultTypeKey]: operationResultType.edge,
  [operationFactoryKey]({ parent, ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const vertexId = parent == null ? null : String(parent)
    if (!vertexId) {
      async function* empty() { }
      return { [Symbol.asyncIterator]: empty }
    }

    const wanted = new Set(normalizeLabels(args))

    return {
      [Symbol.asyncIterator]: (async function* () {
        const ids = await collectEdgeIds({
          store,
          vertexId,
          labels: Array.from(wanted)
        })

        for (const id of ids) {
          if (id != null) yield id
        }
      })
    }
  }
}
