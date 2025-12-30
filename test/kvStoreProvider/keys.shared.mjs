import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

const toSet = async (it) => new Set(await Array.fromAsync(it))

export function runKeysSharedSuite({ label, setup }) {
  suite(`kvStoreProvider/${label}.keys()`, () => {
    const seeded = [
      'root',
      'user.alice.prefs',
      'user.bob.prefs',
      'user.bob.profile',
      'config.ui.theme',
      'config.db.pool.min',
      'config.db.pool.max',
      'env.prod.api',
      'env.prod.api.url',
      'env.staging.api',
      'env.staging.api.url',
      'env.dev.api.url',
    ]

    const seed = async (kv) => {
      for (const k of seeded) {
        try { await kv.create(k, '') } catch { await kv.put(k, '') }
      }
    }
    test(`keys`, async (t) => {
      const { kvp } = await setup()
      t.after(async () => { await kvp?.close?.() })
      assert(typeof kvp.interface.keys === 'function', 'Interface operation:keys not provided')
    })
    test('keys returns promise', async (t) => {
      const { kvp } = await setup()
      t.after(async () => { await kvp?.close?.() })
      const p = kvp.interface.keys()
      assert(p instanceof Promise)
      await p
    })
    test('keys() returns an async iterator', async (t) => {
      const { kvp, kv } = await setup()
      t.after(async () => { await kvp?.close?.() })
      const itr = await kv.keys()
      assert.equal(typeof itr?.[Symbol.asyncIterator], 'function')
    })

    suite('subject-style matching', () => {
      test('baseline: keys() yields all keys (set-equal)', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys())
        assert.deepEqual(got, new Set(seeded))
      })

      test('single-token wildcard *', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('*'))
        assert.deepEqual(got, new Set(['root']))
      })

      test('tokened wildcard with *', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('user.*.prefs'))
        assert.deepEqual(got, new Set(['user.alice.prefs', 'user.bob.prefs']))
      })

      test('full tail wildcard > (user)', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('user.>'))
        assert.deepEqual(got, new Set(['user.alice.prefs', 'user.bob.prefs', 'user.bob.profile']))
      })

      test('full tail wildcard > (config)', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('config.>'))
        assert.deepEqual(got, new Set(['config.ui.theme', 'config.db.pool.min', 'config.db.pool.max']))
      })

      test('full tail wildcard > (env.prod)', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('env.prod.>'))
        assert.deepEqual(got, new Set(['env.prod.api', 'env.prod.api.url']))
      })

      test('union of patterns (array) without overlap', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys(['env.prod.>', 'env.staging.>']))
        assert.deepEqual(got, new Set(['env.prod.api', 'env.prod.api.url', 'env.staging.api', 'env.staging.api.url']))
      })

      test('global tail wildcard > yields all keys', async (t) => {
        const { kvp, kv } = await setup()
        t.after(async () => { await kvp?.close?.() })
        await seed(kv)
        const got = await toSet(await kv.keys('>'))
        assert.deepEqual(got, new Set(seeded))
      })
    })
  })
}
