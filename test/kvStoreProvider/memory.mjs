import { kvProvider } from '../../kvProvider/memory/provider.js'
import { ulid } from 'ulid'
import test, { suite, before } from 'node:test'
import assert from 'node:assert/strict'
import { runGetSuite } from './get.shared.mjs'
import { runPutSuite } from './put.shared.mjs'
import { runUpdateSuite } from './update.shared.mjs'
import { runDeleteSuite } from './delete.shared.mjs'
import { runCreateSuite } from './create.shared.mjs'
import { runKeysSharedSuite } from './keys.shared.mjs'
import { diagnostics } from '@liquid-bricks/lib-diagnostics'

const setup = async () => kvProvider({ config: { bucket: `testing-${ulid()}` }, ctx: { diagnostics: diagnostics() } })

runGetSuite({ label: 'memory', setup })
runPutSuite({ label: 'memory', setup })
runUpdateSuite({ label: 'memory', setup })
runDeleteSuite({ label: 'memory', setup })
runCreateSuite({ label: 'memory', setup, variant: 'memory' })

runKeysSharedSuite({
  label: 'memory',
  setup: async () => {
    const kvp = await kvProvider({ ctx: { diagnostics: diagnostics() } })
    const kv = kvp.interface
    return { kvp, kv }
  }
})

// Provider-specific behaviors for memory
suite('kvStoreProvider/memory.keys() specifics', () => {
  let kv
  before(async () => {
    const kvp = await kvProvider({ ctx: { diagnostics: diagnostics() } })
    kv = kvp.interface
  })

  test('union with duplicate patterns is deduped', async () => {
    const seeded = ['env.prod.api', 'env.prod.api.url']
    for (const k of seeded) {
      try { await kv.create(k, '') } catch { await kv.put(k, '') }
    }
    const it = await kv.keys(['env.prod.>', 'env.prod.>'])
    const got = new Set(await Array.fromAsync(it))
    assert.deepEqual(got, new Set(seeded))
  })
})
