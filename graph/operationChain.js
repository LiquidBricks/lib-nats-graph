import { createHash } from 'node:crypto'
import { ulid } from 'ulid'
import buildMeta from '../build-meta.js'
import {
  operationFactoryKey,
  operationName,
  operationNameKey,
  operationStreamWrapperKey,
  operationUsesTraverserKey,
  operationAppendsToPathKey
} from '../steps/types.js'
import { optimizeOpsChain } from './optimizer.js'

const hashOperationsChain = (operationsChain) => createHash('sha1')
  .update(JSON.stringify(operationsChain.map(({ prop, args }) => ({ prop, args }))))
  .digest('hex')

const cloneLabels = (labels) => {
  if (labels instanceof Map) return new Map(labels)
  if (labels && typeof labels === 'object') return new Map(Object.entries(labels))
  return new Map()
}

const toTraverser = (candidate) => {
  if (candidate && typeof candidate === 'object' && 'value' in candidate) {
    const path = Array.isArray(candidate.path) ? candidate.path : []
    return { value: candidate.value, path: [...path], labels: cloneLabels(candidate.labels) }
  }
  return { value: candidate, path: [], labels: new Map() }
}

const appendPath = (path = [], value, shouldAppend) => shouldAppend ? [...path, value] : [...path]

export async function* operationChainExecutor({ operationsChain, kvStore, diagnostics, yieldTraversers = false, seedTraverser } = {}) {
  const optimizedChain = optimizeOpsChain(operationsChain, { diagnostics })
  const chainHash = hashOperationsChain(optimizedChain)
  const needsPathTracking = optimizedChain.some(({ operation }) => Boolean(operation?.[operationUsesTraverserKey]))
  let trackPaths = needsPathTracking
  let pipeline = seedPipeline({ trackPaths, seedTraverser })
  const queryId = ulid()
  const queryMetaKey = `${buildMeta.packageHash}-query`
  const stepMetaKey = `${buildMeta.packageHash}-step`
  const queryMeta = {
    id: queryId,
    hash: chainHash,
    query: optimizedChain.map(({ prop, args }) => ({ prop, args }))
  }
  const chainDiagnostics = diagnostics.child({ [queryMetaKey]: queryMeta })

  for (const [index, step] of optimizedChain.entries()) {
    const { prop, args } = step
    const stepDiagnostics = chainDiagnostics.child({
      [stepMetaKey]: { prop, args, index, hash: chainHash, queryId }
    })
    pipeline = attachStep({
      pipeline,
      step,
      ctx: { kvStore, diagnostics: stepDiagnostics },
      trackPaths
    })
    if (step.operation?.[operationNameKey] === operationName.path) trackPaths = false
  }

  const unwrapTraversers = trackPaths && !yieldTraversers

  for await (const result of pipeline) {
    if (unwrapTraversers && result && typeof result === 'object' && 'value' in result) {
      yield result.value
      continue
    }
    yield result
  }
}

export function seedPipeline({ trackPaths = false, seedTraverser } = {}) {
  const hasSeed = seedTraverser !== undefined && seedTraverser !== null
  const seed = trackPaths
    ? (hasSeed ? toTraverser(seedTraverser) : { value: null, path: [], labels: new Map() })
    : (hasSeed ? seedTraverser : null)
  return (async function* () { yield seed })()
}

export function attachStep({ pipeline, step, ctx, trackPaths = false }) {
  const { args, operation } = step
  const stepCtx = { kvStore: ctx?.kvStore, diagnostics: ctx?.diagnostics }
  const appendToPath = operation?.[operationAppendsToPathKey] ?? (operation?.[operationNameKey] !== operationName.Graph)

  const streamWrap = operation[operationStreamWrapperKey]
  if (typeof streamWrap === 'function') {
    if (trackPaths && operation?.[operationUsesTraverserKey]) {
      return streamWrap({ ctx: stepCtx, args })(pipeline)
    }

    if (!trackPaths) return streamWrap({ ctx: stepCtx, args })(pipeline)

    return (async function* () {
      let currentParent = { value: null, path: [], labels: new Map() }
      const sourceValues = (async function* () {
        for await (const traverser of pipeline) {
          currentParent = toTraverser(traverser)
          yield currentParent.value
        }
      })()

      const stepIter = streamWrap({ ctx: stepCtx, args })(sourceValues)
      for await (const value of stepIter) {
        yield {
          value,
          path: appendPath(currentParent.path, value, appendToPath),
          labels: cloneLabels(currentParent.labels)
        }
      }
    })()
  }

  const stepFactory = operation[operationFactoryKey]

  return (async function* () {
    for await (const traverser of pipeline) {
      const { value: parent, path, labels } = trackPaths ? toTraverser(traverser) : { value: traverser, path: [], labels: new Map() }
      const itemIter = stepFactory({
        parent,
        ctx: stepCtx,
        args
      })

      for await (const item of itemIter) {
        if (!trackPaths) {
          yield item
          continue
        }

        yield {
          value: item,
          path: appendPath(path, item, appendToPath),
          labels: cloneLabels(labels)
        }
      }
    }
  })()
}
