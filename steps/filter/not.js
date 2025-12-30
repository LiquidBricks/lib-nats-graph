import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'
import { evaluatePredicate } from './predicateUtils.js'

const createNotStep = ({ resultType, startProp }) => ({
  [operationNameKey]: operationName.not,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const [predicate] = args
    diagnostics?.require(
      typeof predicate === 'function',
      Errors.NOT_INVALID_PREDICATE,
      'not(traversal) requires a predicate function.',
      { predicateType: typeof predicate }
    )

    return (source) => (async function* () {
      for await (const item of source) {
        const matches = await evaluatePredicate({ predicate, item, startProp, ctx })
        if (!matches) yield item
      }
    })()
  }
})

export const vertexNot = createNotStep({ resultType: operationResultType.vertex, startProp: 'V' })
export const edgeNot = createNotStep({ resultType: operationResultType.edge, startProp: 'E' })
export const valueNot = createNotStep({ resultType: operationResultType.value, startProp: null })
