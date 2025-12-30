import assert from 'node:assert'
import test, { after, before, suite } from 'node:test'

export function runDeleteSuite({ label, setup }) {
  suite(`kvStoreProvider/${label}`, () => {
    suite('interface', () => {
      let kvp
      before(async () => {
        kvp = await setup()
        assert(typeof kvp.interface === 'object', 'No interface operations provided')
      })
      after(async () => kvp.close?.())

      test(`delete`, async () => assert(typeof kvp.interface.delete === 'function', 'Interface operation:delete not provided'))

      test('delete returns promise', async () => {
        const p = kvp.interface.delete('deletePromise')
        assert(p instanceof Promise)
        await p
      })
      test('delete never existent key, returns helper functions', async () => {
        await kvp.interface.delete('deleteNeverExistent')
        const d = await kvp.interface.get('deleteNeverExistent')
        assert.strictEqual(d.string(), "")
      })
    })
  })
}

