import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  operationUsesTraverserKey,
  operationAppendsToPathKey,
  Errors,
} from '../types.js'
import { evaluatePredicate } from './predicateUtils.js'

const toLabelMap = (candidate) => {
  if (candidate instanceof Map) return new Map(candidate)
  if (candidate && typeof candidate === 'object') return new Map(Object.entries(candidate))
  return new Map()
}

const ensureTraverser = (candidate) => {
  if (candidate && typeof candidate === 'object' && 'value' in candidate) {
    const path = Array.isArray(candidate.path) ? [...candidate.path] : []
    return {
      value: candidate.value,
      path,
      labels: toLabelMap(candidate.labels),
    }
  }

  return {
    value: candidate,
    path: [],
    labels: new Map(),
  }
}

const createWhereStep = ({ resultType, startProp }) => ({
  [operationNameKey]: operationName.where,
  [operationResultTypeKey]: resultType,
  [operationUsesTraverserKey]: true,
  [operationAppendsToPathKey]: false,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const [predicate] = args
    diagnostics?.require(
      typeof predicate === 'function',
      Errors.WHERE_INVALID_PREDICATE,
      'where(predicate) requires a predicate function.',
      { predicateType: typeof predicate }
    )

    return (source) => (async function* () {
      for await (const traverser of source) {
        const current = ensureTraverser(traverser)
        const matches = await evaluatePredicate({
          predicate,
          item: current.value,
          traverser: current,
          startProp,
          ctx,
        })

        if (matches) yield current
      }
    })()
  }
})

export const vertexWhere = createWhereStep({ resultType: operationResultType.vertex, startProp: 'V' })
export const edgeWhere = createWhereStep({ resultType: operationResultType.edge, startProp: 'E' })
export const valueWhere = createWhereStep({ resultType: operationResultType.value, startProp: null })
