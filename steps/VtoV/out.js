import { operationResultTypeKey, operationFactoryKey, operationResultType as sharedElementType, operationNameKey, operationName, operationStreamWrapperKey, Errors } from '../types.js'
import { graphKeyspace } from '../kv/graphKeyspace.js'
import { readChunkedSet } from '../kv/kvUtils.js'

const normalizeLabels = (args) => {
  if (!Array.isArray(args)) return []
  return args
    .filter((label) => label != null && label !== '')
    .map((label) => String(label))
}

export const out = {
  [operationNameKey]: operationName.out,
  [operationResultTypeKey]: sharedElementType.vertex,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
    const wanted = new Set(normalizeLabels(args))
    return (source) => (async function* () {
      diagnostics?.require(!!store, Errors.asdfasdfasd, 'kvStore required in ctx for out() traversal', { where: 'VtoV/out.stream' });
      const seen = new Set()
      for await (const parent of source) {
        const vertexId = parent == null ? null : String(parent)
        if (!vertexId) continue
        try {
          if (wanted.size > 0) {
            for (const label of wanted) {
              const neighbors = await readChunkedSet(store, {
                metaKey: graphKeyspace.adj.outV.labelMeta(vertexId, label),
                chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.labelChunk(vertexId, label, idx),
              })
              const sources = neighbors.length > 0
                ? neighbors
                : await (async () => {
                  const keys = await store.keys(graphKeyspace.vertex.outV.patternByLabel(vertexId, label))
                  const acc = []
                  for await (const key of keys) {
                    const toId = key.split('.').pop()
                    if (toId && toId !== '__index') acc.push(toId)
                  }
                  return acc
                })()
              for (const toId of sources) {
                if (!toId || seen.has(toId)) continue
                seen.add(toId)
                yield toId
              }
            }
          } else {
            const neighbors = await readChunkedSet(store, {
              metaKey: graphKeyspace.adj.outV.meta(vertexId),
              chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.chunk(vertexId, idx),
            })
            const sources = neighbors.length > 0
              ? neighbors
              : await (async () => {
                const keys = await store.keys(graphKeyspace.vertex.outV.pattern(vertexId))
                const acc = []
                for await (const key of keys) {
                  const toId = key.split('.').pop()
                  if (toId && toId !== '__index') acc.push(toId)
                }
                return acc
              })()
            for (const toId of sources) {
              if (!toId || seen.has(toId)) continue
              seen.add(toId)
              yield toId
            }
          }
        } catch { }
      }
    })()
  },
  [operationFactoryKey]({ parent, ctx = {}, args = [] } = {}) {
    const { kvStore: store, diagnostics } = ctx;
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
              metaKey: graphKeyspace.adj.outV.labelMeta(vertexId, label),
              chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.labelChunk(vertexId, label, idx),
            })
            const sources = neighbors.length > 0
              ? neighbors
              : await (async () => {
                const keys = await store.keys(graphKeyspace.vertex.outV.patternByLabel(vertexId, label))
                const acc = []
                for await (const key of keys) {
                  const toId = key.split('.').pop()
                  if (toId && toId !== '__index') acc.push(toId)
                }
                return acc
              })()
            for (const toId of sources) {
              if (!toId || seen.has(toId)) continue
              seen.add(toId)
              yield toId
            }
          }
        } else {
          const neighbors = await readChunkedSet(store, {
            metaKey: graphKeyspace.adj.outV.meta(vertexId),
            chunkKeyForIndex: (idx) => graphKeyspace.adj.outV.chunk(vertexId, idx),
          })
          const sources = neighbors.length > 0
            ? neighbors
            : await (async () => {
              const keys = await store.keys(graphKeyspace.vertex.outV.pattern(vertexId))
              const acc = []
              for await (const key of keys) {
                const toId = key.split('.').pop()
                if (toId && toId !== '__index') acc.push(toId)
              }
              return acc
            })()
          for (const toId of sources) {
            if (!toId || seen.has(toId)) continue
            seen.add(toId)
            yield toId
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
