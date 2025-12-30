import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runLimitSuite({ label, setup }) {
  suite(`limit() traversal integration [${label}]`, () => {
    test('limits vertex results', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['A', 'B', 'C']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }
      const out = await graph.g.V().limit(2)
      assert.equal(out.length, 2)
      assert.deepEqual(new Set(out), new Set(ids.slice(0, 2)))
    })
  })
}

