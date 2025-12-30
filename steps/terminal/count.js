import {
  operationResultTypeKey,
  operationStreamWrapperKey,
  operationResultType,
  operationNameKey,
  operationName,
} from '../types.js'

export const count = {
  [operationNameKey]: operationName.count,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey](_config = {}) {
    // count() takes no arguments; ignore any that are passed
    return (source) => (async function* () {
      let total = 0
      // Support passing either an async iterable or a Promise resolving to one
      const resolved = await source
      for await (const _ of resolved) total += 1
      yield total
    })()
  }
}
