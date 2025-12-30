import assert from 'node:assert'
import test, { after, before, suite } from 'node:test'

export function runPutSuite({ label, setup }) {
  suite(`kvStoreProvider/${label}`, () => {
    suite('interface', () => {
      let kvp
      before(async () => {
        kvp = await setup()
        assert(typeof kvp.interface === 'object', 'No interface operations provided')
      })
      after(async () => kvp.close?.())

      test(`put`, async () => assert(typeof kvp.interface.put === 'function', 'Interface operation:put not provided'))

      test('put returns promise', async () => {
        const p = kvp.interface.put('putPromise')
        assert(p instanceof Promise)
        await p
      })
      test('put empty payload. get returns empty string', async () => {
        await kvp.interface.put('putEmptyPayload')
        const d = await kvp.interface.get('putEmptyPayload')
        assert(d.string() === '', 'Empty payload should return empty string')
      })
      test('put allows string,Uint8Array,Buffer payloads.', async () => assert.doesNotReject(async () => {
        await kvp.interface.put('putStringPayload', "xyz")
        await kvp.interface.put('putUint8ArrayPayload', new Uint8Array([1, 2, 3]))
        await kvp.interface.put('putStringPayload', Buffer.from('abc'))
      }))
      test('put returns monotonic revision numbers', async () => assert.doesNotReject(async () => {
        let lastRevNumber = 0
        for (let i = 1; i < 100; i++) {
          const revNumber = await kvp.interface.put('putCheckRevisionNumber')
          assert(lastRevNumber < revNumber)
          lastRevNumber = revNumber
        }
      }))
    })
  })
}

