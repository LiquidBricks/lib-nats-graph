import { operationResultTypeKey, operationFactoryKey, operationResultType, operationNameKey, operationName, operationStreamWrapperKey } from '../types.js'

export const id = {
  [operationNameKey]: operationName.id,
  [operationResultTypeKey]: operationResultType.value,
  [operationStreamWrapperKey](_config = {}) {
    return (source) => (async function* () { for await (const i of source) yield i })()
  },
  [operationFactoryKey]({ parent: id } = {}) {
    async function* itr() {
      yield id;
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}
