import {
  operationResultTypeKey,
  operationFactoryKey,
  operationResultType as sharedElementType,
  operationNameKey,
  operationName,
  operationStreamWrapperKey,
  Errors
} from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { readChunkedSet } from '../kv/kvUtils.js'

const normalizeLabels = (args) => {
  if (!Array.isArray(args)) return []
  return args
    .filter((label) => label != null && label !== '')
    .map((label) => String(label))
}

export const inStep = {
  [operationNameKey]: operationName.in,
  [operationResultTypeKey]: sharedElementType.vertex,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx
    const wanted = new Set(normalizeLabels(args))
    if (!store) console.error('VtoV/in factory missing store')
    return (source) => (async function* () {
      const seen = new Set()
      for await (const parent of source) {
        const vertexId = parent == null ? null : String(parent)
        if (!vertexId) continue
        try {
          if (wanted.size > 0) {
            for (const label of wanted) {
              const neighbors = await readChunkedSet(store, {
                metaKey: graphKeyspace.adj.inV.labelMeta(vertexId, label),
                chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.labelChunk(vertexId, label, idx),
              })
              const sources = neighbors.length > 0
                ? neighbors
                : await (async () => {
                  const keys = await store.keys(graphKeyspace.vertex.inV.patternByLabel(vertexId, label))
                  const acc = []
                  for await (const key of keys) {
                    const fromId = key.split('.').pop()
                    if (fromId && fromId !== '__index') acc.push(fromId)
                  }
                  return acc
                })()
              for (const fromId of sources) {
                if (!fromId || fromId === '__index' || seen.has(fromId)) continue
                seen.add(fromId)
                yield fromId
              }
            }
          } else {
            const neighbors = await readChunkedSet(store, {
              metaKey: graphKeyspace.adj.inV.meta(vertexId),
              chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.chunk(vertexId, idx),
            })
            const sources = neighbors.length > 0
              ? neighbors
              : await (async () => {
                const keys = await store.keys(graphKeyspace.vertex.inV.pattern(vertexId))
                const acc = []
                for await (const key of keys) {
                  const fromId = key.split('.').pop()
                  if (fromId && fromId !== '__index') acc.push(fromId)
                }
                return acc
              })()
            for (const fromId of sources) {
              if (!fromId || fromId === '__index' || seen.has(fromId)) continue
              seen.add(fromId)
              yield fromId
            }
          }
        } catch {
          /* ignore traversal errors */
        }
      }
    })()
  },
  [operationFactoryKey]({ parent, ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx
    const vertexId = parent == null ? null : String(parent)
    if (!vertexId) {
      async function* empty() { }
      return { [Symbol.asyncIterator]: empty }
    }

    const wanted = new Set(normalizeLabels(args))

    async function* iterator() {
      const seen = new Set()
      try {
        if (wanted.size > 0) {
          for (const label of wanted) {
            const neighbors = await readChunkedSet(store, {
              metaKey: graphKeyspace.adj.inV.labelMeta(vertexId, label),
              chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.labelChunk(vertexId, label, idx),
            })
            const sources = neighbors.length > 0
              ? neighbors
              : await (async () => {
                const keys = await store.keys(graphKeyspace.vertex.inV.patternByLabel(vertexId, label))
                const acc = []
                for await (const key of keys) {
                  const fromId = key.split('.').pop()
                  if (fromId && fromId !== '__index') acc.push(fromId)
                }
                return acc
              })()
            for (const fromId of sources) {
              if (!fromId || fromId === '__index' || seen.has(fromId)) continue
              seen.add(fromId)
              yield fromId
            }
          }
        } else {
          const neighbors = await readChunkedSet(store, {
            metaKey: graphKeyspace.adj.inV.meta(vertexId),
            chunkKeyForIndex: (idx) => graphKeyspace.adj.inV.chunk(vertexId, idx),
          })
          const sources = neighbors.length > 0
            ? neighbors
            : await (async () => {
              const keys = await store.keys(graphKeyspace.vertex.inV.pattern(vertexId))
              const acc = []
              for await (const key of keys) {
                const fromId = key.split('.').pop()
                if (fromId && fromId !== '__index') acc.push(fromId)
              }
              return acc
            })()
          for (const fromId of sources) {
            if (!fromId || fromId === '__index' || seen.has(fromId)) continue
            seen.add(fromId)
            yield fromId
          }
        }
      } catch {
        /* ignore traversal errors */
      }
    }

    return {
      [Symbol.asyncIterator]: iterator
    }
  }
}
