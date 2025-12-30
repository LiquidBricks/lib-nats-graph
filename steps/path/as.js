import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  operationUsesTraverserKey,
  operationAppendsToPathKey,
  Errors
} from '../types.js'

const normalizeLabel = (label, idx, diagnostics) => {
  diagnostics?.require(
    typeof label === 'string' && label.length > 0,
    Errors.AS_INVALID_LABEL,
    'as(label) requires non-empty string labels',
    { label, index: idx }
  )
  return label
}

const cloneLabels = (candidate) => {
  if (candidate instanceof Map) return new Map(candidate)
  if (candidate && typeof candidate === 'object') return new Map(Object.entries(candidate))
  return new Map()
}

const ensureTraverser = (candidate) => {
  if (candidate && typeof candidate === 'object' && 'value' in candidate) return candidate
  return { value: candidate, path: [] }
}

const createAsStep = (resultType) => ({
  [operationNameKey]: operationName.as,
  [operationResultTypeKey]: resultType,
  [operationUsesTraverserKey]: true,
  [operationAppendsToPathKey]: false,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const labels = (Array.isArray(args) ? args : [])
      .flat()
      .map((label, idx) => normalizeLabel(label, idx, diagnostics))

    return (source) => (async function* () {
      for await (const traverser of source) {
        if (labels.length === 0) {
          yield traverser
          continue
        }

        const current = ensureTraverser(traverser)
        const bindings = cloneLabels(current.labels)
        for (const label of labels) {
          bindings.set(label, current.value)
        }

        yield {
          ...current,
          labels: bindings
        }
      }
    })()
  }
})

export const vertexAs = createAsStep(operationResultType.vertex)
export const edgeAs = createAsStep(operationResultType.edge)
export const valueAs = createAsStep(operationResultType.value)
