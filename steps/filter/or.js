import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'
import { evaluatePredicate } from './predicateUtils.js'

const createOrStep = ({ resultType, startProp }) => ({
  [operationNameKey]: operationName.or,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args: predicates = [] } = {}) {
    const { diagnostics } = ctx
    diagnostics?.require(
      predicates.length > 0 && predicates.every((predicate) => typeof predicate === 'function'),
      Errors.OR_INVALID_PREDICATE,
      'or(...predicates) requires one or more predicate functions.',
      { predicatesLength: predicates.length, predicateTypes: predicates.map((p) => typeof p) }
    )

    return (source) => (async function* () {
      outer: for await (const item of source) {
        for (const predicate of predicates) {
          const matches = await evaluatePredicate({ predicate, item, startProp, ctx })
          if (matches) {
            yield item
            continue outer
          }
        }
      }
    })()
  }
})

export const vertexOr = createOrStep({ resultType: operationResultType.vertex, startProp: 'V' })
export const edgeOr = createOrStep({ resultType: operationResultType.edge, startProp: 'E' })
export const valueOr = createOrStep({ resultType: operationResultType.value, startProp: null })
