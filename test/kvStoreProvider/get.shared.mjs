import assert from 'node:assert'
import test, { after, before, suite } from 'node:test'

export function runGetSuite({ label, setup }) {
  suite(`kvStoreProvider/${label}`, () => {
    suite('interface', () => {
      let kvp
      before(async () => {
        kvp = await setup()
        assert(typeof kvp.interface === 'object', 'No interface operations provided')
      })
      after(async () => kvp.close?.())

      test(`get`, async () => assert(typeof kvp.interface.get === 'function', 'Interface operation:get not provided'))

      test('get returns promise', async () => {
        const p = kvp.interface.get('getPromise')
        assert(p instanceof Promise)
        await p
      })
      test('get nonExistent key, returns null', async () => {
        const d = await kvp.interface.get('getNonExistent')
        assert(d === null)
      })
      test('get existing key, returns helper functions', async () => {
        await kvp.interface.put('getHelpers')
        const d = await kvp.interface.get('getHelpers')
        assert(typeof d.string === 'function')
        assert(typeof d.json === 'function')
      })
    })
  })
}

