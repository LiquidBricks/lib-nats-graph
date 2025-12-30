import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  operationUsesTraverserKey,
  Errors,
} from '../types.js'

const normalizeLabel = (label, idx, diagnostics) => {
  diagnostics?.require(
    typeof label === 'string' && label.length > 0,
    Errors.SELECT_INVALID_LABEL,
    'select(label) requires non-empty string labels',
    { label, index: idx }
  )
  return label
}

const toLabelMap = (candidate) => {
  if (candidate instanceof Map) return candidate
  if (candidate && typeof candidate === 'object') return new Map(Object.entries(candidate))
  return new Map()
}

const ensureTraverser = (candidate) => {
  if (candidate && typeof candidate === 'object' && 'value' in candidate) {
    const path = Array.isArray(candidate.path) ? candidate.path : []
    return { ...candidate, path, labels: toLabelMap(candidate.labels) }
  }
  return { value: candidate, path: [], labels: new Map() }
}

const appendToPath = (path, value) => {
  const basePath = Array.isArray(path) ? path : []
  return [...basePath, value]
}

export const select = {
  [operationNameKey]: operationName.select,
  [operationResultTypeKey]: operationResultType.value,
  [operationUsesTraverserKey]: true,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const requestedLabels = (Array.isArray(args) ? args : [])
      .flat()
      .map((label, idx) => normalizeLabel(label, idx, diagnostics))

    diagnostics?.require(
      requestedLabels.length > 0,
      Errors.SELECT_INVALID_LABEL,
      'select(label) requires at least one label argument',
      { labels: requestedLabels }
    )

    return (source) => (async function* () {
      for await (const traverser of source) {
        const current = ensureTraverser(traverser)
        const bindings = toLabelMap(current.labels)
        const selections = requestedLabels.map((label) => {
          diagnostics?.require(
            bindings.has(label),
            Errors.SELECT_LABEL_MISSING,
            `select('${label}') requires a previously bound label`,
            { label, available: Array.from(bindings.keys()) }
          )
          return [label, bindings.get(label)]
        })

        const value = selections.length === 1
          ? selections[0][1]
          : Object.fromEntries(selections)

        yield {
          ...current,
          value,
          path: appendToPath(current.path, value),
          labels: bindings,
        }
      }
    })()
  }
}
