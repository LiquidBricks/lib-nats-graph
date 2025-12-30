import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runVSuite({ label, setup }) {
  suite(`V() traversal integration [${label}]`, () => {
    test('returns [] on an empty graph', async (t) => {
      const graph = await setup(t)
      const out = await graph.g.V()
      assert.deepEqual(out, [])
    })

    test('enumerates all vertices (order-agnostic)', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['A', 'B', 'C']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }
      const out = await graph.g.V()
      assert.deepEqual(new Set(out), new Set(ids))
    })

    test('V(id) and V([ids]) preserve provided ordering for existing ids', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['1', '2', '3']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }

      const single = await graph.g.V(ids[0])
      assert.deepEqual(single, [ids[0]])

      const ordered = await graph.g.V([ids[2], ids[0], ids[1], ids[0]])
      assert.deepEqual(ordered, [ids[2], ids[0], ids[1], ids[0]])
    })
  })
}

