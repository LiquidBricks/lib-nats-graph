import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'

const createLimitStep = (resultType) => ({
  [operationNameKey]: operationName.limit,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx;
    const [n] = args
    diagnostics?.require(
      Number.isInteger(n) && n >= 0,
      Errors.LIMIT_INVALID,
      'limit(n) requires a non-negative integer.',
      { n }
    )

    return (source) => (async function* () {
      let seen = 0
      for await (const item of source) {
        if (seen++ < n) {
          yield item
          continue
        }

        break
      }
    })()
  }
})

export const vertexLimit = createLimitStep(operationResultType.vertex)
export const edgeLimit = createLimitStep(operationResultType.edge)
export const valueLimit = createLimitStep(operationResultType.value)
