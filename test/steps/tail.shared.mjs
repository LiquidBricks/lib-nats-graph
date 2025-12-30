import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runTailSuite({ label, setup }) {
  suite(`tail() traversal integration [${label}]`, () => {
    test('returns the last vertex by default', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['A', 'B', 'C']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }

      const out = await graph.g.V().tail()

      assert.deepEqual(out, [ids.at(-1)])
    })

    test('returns the last n vertices in order', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['W', 'X', 'Y', 'Z']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }

      const out = await graph.g.V().tail(2)

      assert.deepEqual(out, ids.slice(-2))
    })

    test('supports tail(0) returning an empty result', async (t) => {
      const graph = await setup(t)
      await graph.g.addV('solo')

      const out = await graph.g.V().tail(0)

      assert.deepEqual(out, [])
    })
  })
}
