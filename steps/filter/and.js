import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'
import { evaluatePredicate } from './predicateUtils.js'

const createAndStep = ({ resultType, startProp }) => ({
  [operationNameKey]: operationName.and,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args: predicates = [] } = {}) {
    const { diagnostics } = ctx
    diagnostics?.require(
      predicates.length > 0 && predicates.every((predicate) => typeof predicate === 'function'),
      Errors.AND_INVALID_PREDICATE,
      'and(...predicates) requires one or more predicate functions.',
      { predicatesLength: predicates.length, predicateTypes: predicates.map((p) => typeof p) }
    )

    return (source) => (async function* () {
      outer: for await (const item of source) {
        for (const predicate of predicates) {
          const matches = await evaluatePredicate({ predicate, item, startProp, ctx })
          if (!matches) continue outer
        }
        yield item
      }
    })()
  }
})

export const vertexAnd = createAndStep({ resultType: operationResultType.vertex, startProp: 'V' })
export const edgeAnd = createAndStep({ resultType: operationResultType.edge, startProp: 'E' })
export const valueAnd = createAndStep({ resultType: operationResultType.value, startProp: null })
