import { operationResultType, operationResultTypeKey, operationFactoryKey, operationNameKey, operationName, operationStreamWrapperKey } from '../types.js';

export const Graph = {
  [operationNameKey]: operationName.Graph,
  [operationResultTypeKey]: operationResultType.graph,
  [operationStreamWrapperKey]() {
    return (source) => (async function* () {
      for await (const _ of source) {
        yield
      }
    })()
  },
  [operationFactoryKey]() {
    async function* itr() {
      yield
    }

    return {
      [Symbol.asyncIterator]: itr,
    };
  }
}
