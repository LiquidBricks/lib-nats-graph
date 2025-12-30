import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'
import { evaluatePredicate } from './predicateUtils.js'

const createFilterStep = ({ resultType, startProp }) => ({
  [operationNameKey]: operationName.filter,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const [predicate] = args
    diagnostics?.require(
      typeof predicate === 'function',
      Errors.FILTER_INVALID_PREDICATE,
      'filter(predicate) requires a predicate function.',
      { predicateType: typeof predicate }
    )

    return (source) => (async function* () {
      for await (const item of source) {
        const matches = await evaluatePredicate({ predicate, item, startProp, ctx })
        if (matches) yield item
      }
    })()
  }
})

export const vertexFilter = createFilterStep({ resultType: operationResultType.vertex, startProp: 'V' })
export const edgeFilter = createFilterStep({ resultType: operationResultType.edge, startProp: 'E' })
export const valueFilter = createFilterStep({ resultType: operationResultType.value, startProp: null })
