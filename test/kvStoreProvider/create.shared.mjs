import assert from 'node:assert'
import test, { after, before, suite } from 'node:test'

export function runCreateSuite({ label, setup, variant }) {
  suite(`kvStoreProvider/${label}`, () => {
    suite('interface', () => {
      let kvp
      before(async () => {
        kvp = await setup()
        assert(typeof kvp.interface === 'object', 'No interface operations provided')
      })
      after(async () => kvp.close?.())

      test(`create`, async () => assert(typeof kvp.interface.create === 'function', 'Interface operation:create not provided'))

      test('create returns promise', async () => {
        const p = kvp.interface.create('createPromise')
        assert(p instanceof Promise)
        await p
      })
      test('create empty payload. get returns empty string', async () => {
        await kvp.interface.create('createEmptyPayload')
        const d = await kvp.interface.get('createEmptyPayload')
        assert(d.string() === '', 'Empty payload should return empty string')
      })
      test('create allows string,Uint8Array,Buffer payloads.', async () => assert.doesNotReject(async () => {
        await kvp.interface.create('createStringPayload', "xyz")
        await kvp.interface.create('createUint8ArrayPayload', new Uint8Array([1, 2, 3]))
        await kvp.interface.create('createBufferPayload', Buffer.from('abc'))
      }))
      test('create the same existing key throws', async () => {
        const d = await kvp.interface.create('createSameKey')
        if (variant === 'nats') {
          await assert.rejects(async () => kvp.interface.create('createSameKey'), (err) => {
            assert.strictEqual(err.name, 'JetStreamApiError');
            assert.strictEqual(err.code, 10071)
            return true;
          })
        } else {
          await assert.rejects(async () => kvp.interface.create('createSameKey'))
        }
      })
      test('create returns monotonic revision numbers', async () => assert.doesNotReject(async () => {
        let lastRevNumber = 0
        for (let i = 1; i < 100; i++) {
          const revNumber = await kvp.interface.create('createCheckRevisionNumber' + i)
          assert(lastRevNumber < revNumber)
          lastRevNumber = revNumber
        }
      }))
    })
  })
}

