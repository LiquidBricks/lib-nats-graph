import { operationName, operationNameKey, operationResultTypeKey, Errors } from "../steps/types.js"
import { nextAvailableOperationsMap } from "../steps/outputTypeMappings.js"
import { Graph } from "../steps/root/Graph.js"
import { _vHasLabel } from "../steps/optimized/_vHasLabel.js"


function* getNextChainOperator(chain) {
  while (chain.length !== 0)
    yield chain.shift()
}
export function optimizeOpsChain(originalOperationsChain, { diagnostics }) {
  const operationsChain = [{ prop: 'Graph', args: [], operation: Graph }]
  let operationsChainCursor = 0

  for (const { prop, args } of getNextChainOperator(originalOperationsChain)) {
    const previousResultType = operationsChain[operationsChainCursor].operation[operationResultTypeKey]
    const operation = nextAvailableOperationsMap.get(previousResultType).get(prop)
    diagnostics.invariant(
      !!operation,
      Errors.INVALID_OPERATION,
      `Operation ${prop}(${args.join()}) Not Allowed.`,
      { operation, prop, args, operationsChain, operationsChainCursor, previousResultType }
    )

    operationsChain.push({ prop, args, operation })
    operationsChainCursor++
  }


  if (operationsChain.length > 2) {
    // const [, c1, c2] = operationsChain
    // if (
    //   c1.operation[operationNameKey] === operationName.V &&
    //   c1.args.length === 0 &&
    //   c2.operation[operationNameKey] === operationName.has &&
    //   c2.args[0] === 'label'
    // )
    //   operationsChain.splice(1, 2, { prop: '_vHasLabel', args: [c2.args[1]], operation: _vHasLabel })
  }

  return operationsChain
}
