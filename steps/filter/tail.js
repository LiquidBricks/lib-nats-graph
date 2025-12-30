import {
  operationName,
  operationNameKey,
  operationResultType,
  operationResultTypeKey,
  operationStreamWrapperKey,
  Errors,
} from '../types.js'

const createTailStep = (resultType) => ({
  [operationNameKey]: operationName.tail,
  [operationResultTypeKey]: resultType,
  [operationStreamWrapperKey]({ ctx = {}, args = [] } = {}) {
    const { diagnostics } = ctx
    const [rawN] = args
    const n = rawN === undefined ? 1 : rawN

    diagnostics?.require(
      Number.isInteger(n) && n >= 0,
      Errors.TAIL_INVALID,
      'tail([n]) requires a non-negative integer.',
      { n: rawN }
    )

    return (source) => (async function* () {
      const buffer = []
      for await (const item of source) {
        buffer.push(item)
        if (buffer.length > n) buffer.shift()
      }

      if (n === 0) return

      for (const item of buffer) {
        yield item
      }
    })()
  }
})

export const vertexTail = createTailStep(operationResultType.vertex)
export const edgeTail = createTailStep(operationResultType.edge)
export const valueTail = createTailStep(operationResultType.value)
