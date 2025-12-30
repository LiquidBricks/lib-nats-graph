import assert from 'node:assert'
import test, { after, before, suite } from 'node:test'

export function runUpdateSuite({ label, setup }) {
  suite(`kvStoreProvider/${label}`, () => {
    suite('interface', () => {
      let kvp
      before(async () => {
        kvp = await setup()
        assert(typeof kvp.interface === 'object', 'No interface operations provided')
      })
      after(async () => kvp.close?.())

      test(`update`, async () => assert(typeof kvp.interface.update === 'function', 'Interface operation:update not provided'))

      test('update returns promise', async () => {
        const p = kvp.interface.update('updatePromise')
        assert(p instanceof Promise)
        await p
      })
      test('update empty payload. get returns empty string', async () => {
        await kvp.interface.update('updateEmptyPayload')
        const d = await kvp.interface.get('updateEmptyPayload')
        assert(d.string() === '', 'Empty payload should return empty string')
      })
      test('update allows string,Uint8Array,Buffer payloads.', async () => assert.doesNotReject(async () => {
        await kvp.interface.update('updateStringPayload', "xyz")
        await kvp.interface.update('updateUint8ArrayPayload', new Uint8Array([1, 2, 3]))
        await kvp.interface.update('updateStringPayload', Buffer.from('abc'))
      }))
      test('update returns monotonic revision numbers', async () => assert.doesNotReject(async () => {
        let lastRevNumber = 0
        for (let i = 1; i < 100; i++) {
          const revNumber = await kvp.interface.update('updateCheckRevisionNumber')
          assert(lastRevNumber < revNumber)
          lastRevNumber = revNumber
        }
      }))
    })
  })
}

