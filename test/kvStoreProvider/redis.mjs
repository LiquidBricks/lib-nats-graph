import assert from 'node:assert/strict'
import test, { suite } from 'node:test'
import { ulid } from 'ulid'
import { kvProvider, KVProviderErrors } from '../../kvProvider/redis/provider.js'
import { diagnostics } from '@liquid-bricks/lib-diagnostics'
import { runGetSuite } from './get.shared.mjs'
import { runPutSuite } from './put.shared.mjs'
import { runUpdateSuite } from './update.shared.mjs'
import { runDeleteSuite } from './delete.shared.mjs'
import { runCreateSuite } from './create.shared.mjs'
import { runKeysSharedSuite } from './keys.shared.mjs'

const REDIS_URL = process.env.REDIS_URL ?? process.env.REDIS_TEST_URL ?? 'redis://127.0.0.1:6379'
const REDIS_DB = process.env.REDIS_DB ?? process.env.REDIS_DATABASE
const diagnosticsFactory = () => diagnostics()

const baseConfig = () => {
  const cfg = {
    url: REDIS_URL,
    keyPrefix: `nats-graph-test-${ulid()}`,
  }
  if (REDIS_DB !== undefined) cfg.database = Number(REDIS_DB)
  return cfg
}

const setup = async () => kvProvider({ config: baseConfig(), ctx: { diagnostics: diagnosticsFactory() } })

suite('kvStoreProvider/redis config', () => {
  test('requires config.url', async () => {
    await assert.rejects(
      async () => kvProvider({ config: { keyPrefix: 'x' }, ctx: { diagnostics: diagnosticsFactory() } }),
      (err) => err?.code === KVProviderErrors.URL_REQUIRED || /url/i.test(String(err?.message ?? ''))
    )
  })

  test('connects and closes', async () => {
    const kvp = await setup()
    assert(typeof kvp.close === 'function')
    await assert.doesNotReject(() => kvp.close())
  })
})

runGetSuite({ label: 'redis', setup })
runPutSuite({ label: 'redis', setup })
runUpdateSuite({ label: 'redis', setup })
runDeleteSuite({ label: 'redis', setup })
runCreateSuite({ label: 'redis', setup, variant: 'redis' })

runKeysSharedSuite({
  label: 'redis',
  setup: async () => {
    const kvp = await kvProvider({ config: baseConfig(), ctx: { diagnostics: diagnosticsFactory() } })
    const kv = kvp.interface
    return { kvp, kv }
  }
})
