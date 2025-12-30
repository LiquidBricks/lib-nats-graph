import { operationChainExecutor } from '../../graph/operationChain.js'

export const hasResults = async (candidate) => {
  let value = candidate
  if (typeof value?.then === 'function') value = await value

  if (value?.[Symbol.asyncIterator]) {
    for await (const _ of value) return true
    return false
  }

  if (value?.[Symbol.iterator]) {
    for (const _ of value) return true
    return false
  }

  return Boolean(value)
}

export const buildTraversal = ({ startProp, seed }) => {
  const operationsChain = [{ prop: startProp, args: [seed] }]
  const traversal = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined
      if (prop === Symbol.toStringTag) return 'TraversalBuilder'
      return (...args) => {
        operationsChain.push({ prop, args })
        return traversal
      }
    }
  })

  return { operationsChain, traversal }
}

export const hasTraversalResults = async ({ operationsChain, ctx = {}, seedTraverser } = {}) => {
  const traversal = operationChainExecutor({
    operationsChain,
    kvStore: ctx.kvStore,
    diagnostics: ctx.diagnostics,
    seedTraverser,
  })
  for await (const _ of traversal) return true
  return false
}

const toLabelMap = (candidate) => {
  if (candidate instanceof Map) return new Map(candidate)
  if (candidate && typeof candidate === 'object') return new Map(Object.entries(candidate))
  return new Map()
}

const clonePath = (candidate) => Array.isArray(candidate) ? [...candidate] : []

const buildHelpers = (traverser) => {
  if (!traverser) {
    const labels = new Map()
    return {
      value: undefined,
      path: [],
      labels,
      hasLabel: () => false,
      select: () => undefined,
    }
  }

  const labels = toLabelMap(traverser.labels)
  const path = clonePath(traverser.path)

  return {
    value: traverser.value,
    path,
    labels,
    hasLabel: (label) => labels.has(label),
    select: (label) => labels.get(label),
  }
}

export const evaluatePredicate = async ({ predicate, item, startProp, ctx = {}, traverser }) => {
  const helpers = buildHelpers(traverser)
  if (!startProp) return hasResults(predicate(item, helpers))

  const { operationsChain, traversal } = buildTraversal({ startProp, seed: item })
  const predicateResult = predicate(traversal, helpers)
  if (predicateResult !== traversal && predicateResult !== undefined) {
    return hasResults(predicateResult)
  }

  return hasTraversalResults({ operationsChain, ctx, seedTraverser: traverser })
}
