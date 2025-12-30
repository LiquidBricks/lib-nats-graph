import {
  operationResultTypeKey,
  operationResultType,
  operationNameKey,
  operationName,
  operationStreamWrapperKey,
  operationUsesTraverserKey
} from '../types.js'

export const path = {
  [operationNameKey]: operationName.path,
  [operationResultTypeKey]: operationResultType.value,
  [operationUsesTraverserKey]: true,
  [operationStreamWrapperKey](_config = {}) {
    return (source) => (async function* () {
      for await (const traverser of source) {
        if (Array.isArray(traverser?.path)) {
          yield [...traverser.path]
          continue
        }

        if (traverser && typeof traverser === 'object' && 'value' in traverser) {
          yield [traverser.value]
          continue
        }

        if (traverser === undefined) {
          yield []
          continue
        }

        yield [traverser]
      }
    })()
  }
}
