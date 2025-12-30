import assert from 'node:assert/strict'
import test, { suite, before } from 'node:test'
import { NATS_IP_ADDRESS } from '../util/config.js'
import { kvProvider, KVProviderErrors } from '../../kvProvider/nats/provider.js'
import { ulid } from 'ulid'
import { runKeysSharedSuite } from './keys.shared.mjs'
import { startDummyServer } from '../util/dummyServer.js'
import { runGetSuite } from './get.shared.mjs'
import { runPutSuite } from './put.shared.mjs'
import { runUpdateSuite } from './update.shared.mjs'
import { runDeleteSuite } from './delete.shared.mjs'
import { runCreateSuite } from './create.shared.mjs'
import { diagnostics } from '@liquid-bricks/lib-diagnostics'

runKeysSharedSuite({
  label: 'nats',
  setup: async () => {
    assert.ok(NATS_IP_ADDRESS, 'NATS_IP_ADDRESS missing; check test/.env')
    const kvp = await kvProvider({
      config: { servers: NATS_IP_ADDRESS, bucket: `keys-${ulid()}` },
      ctx: { diagnostics: diagnostics() }
    })
    const kv = kvp.interface
    return { kvp, kv }
  }
})

suite('kvStoreProvider/nats', () => {
  before(async () => {
    assert.ok(NATS_IP_ADDRESS, 'NATS_IP_ADDRESS missing; check test/.env')
  })
  suite('network', () => {
    test(`should reject with missing configuration params`, async (t) => {
      const { address, port, close } = await startDummyServer(socket => socket.on('data', () => { }));
      t.after(() => close());
      await assert.rejects(async () => kvProvider({
        config: {},
        ctx: { diagnostics: diagnostics() }
      }), (err) => err?.code === KVProviderErrors.SERVERS_REQUIRED && err?.type === 'Precondition')

      await assert.rejects(async () => kvProvider({
        config: { servers: `${address}:${port}` },
        ctx: { diagnostics: diagnostics() }
      }), (err) => err?.code === KVProviderErrors.BUCKET_REQUIRED && err?.type === 'Precondition')
    })
    test(`should recieve ConnectionError from misconfiguration`, async (t) => {
      const { address, port, close } = await startDummyServer(socket => socket.on('data', () => { }));
      t.after(() => close());

      assert.rejects(async () => kvProvider({
        config: { servers: `${address}:${port}`, bucket: `test-${ulid()}` },
        ctx: { diagnostics: diagnostics() }
      }), {
        name: 'ConnectionError'
      })
    })
    test('should connect and disconnect', async (t) => {
      let kvp
      await assert.doesNotReject(async () => {
        kvp = await kvProvider({
          config: { servers: NATS_IP_ADDRESS, bucket: `test-${ulid()}` },
          ctx: { diagnostics: diagnostics() }
        })
      })
      assert(typeof kvp.close === 'function', 'No close function provided')
      assert.doesNotReject(async () => kvp.close())
    })
  })

  const setup = async () => kvProvider({
    config: { servers: NATS_IP_ADDRESS, bucket: `testing-${ulid()}` },
    ctx: { diagnostics: diagnostics() }
  })

  runGetSuite({ label: 'nats', setup })
  runPutSuite({ label: 'nats', setup })
  runUpdateSuite({ label: 'nats', setup })
  runDeleteSuite({ label: 'nats', setup })
  runCreateSuite({ label: 'nats', setup, variant: 'nats' })
})
