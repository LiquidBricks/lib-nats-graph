import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runIdSuite({ label, setup }) {
  suite(`id() traversal integration [${label}]`, () => {
    test('returns the ids of vertices', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['A', 'B']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }
      const out = await graph.g.V(ids).id()
      assert.deepEqual(out, ids)
    })
  })
}

