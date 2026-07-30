import assert from 'node:assert/strict'
import test from 'node:test'

import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'
import { KVSTORE_MISSING } from '@liquid-bricks/lib-diagnostics/codes'
import { out } from '../../steps/VtoV/out.js'
import { operationStreamWrapperKey } from '../../steps/types.js'

test('out() reports KVSTORE_MISSING when its traversal context has no store', async () => {
  const diagnostics = createDiagnostics({
    logger: {
      error() {},
      warn() {},
      info() {},
      debug() {},
    },
    metrics: {
      count() {},
      timing() {},
    },
  })
  const stream = out[operationStreamWrapperKey]({ ctx: { diagnostics } })
  const source = (async function* () {
    yield 'vertex-1'
  })()

  await assert.rejects(
    async () => Array.fromAsync(stream(source)),
    (error) => error.code === KVSTORE_MISSING,
  )
})
