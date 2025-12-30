import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runESuite({ label, setup }) {
  suite(`E() traversal integration [${label}]`, () => {
    test('returns [] on an empty graph', async (t) => {
      const graph = await setup(t)
      const out = await graph.g.E()
      assert.deepEqual(out, [])
    })

    test('enumerates all edges (order-agnostic)', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B'), graph.g.addV('C')])
      const ids = []
      ids.push((await graph.g.addE('x', a, b))[0])
      ids.push((await graph.g.addE('y', b, c))[0])
      const out = await graph.g.E()
      assert.deepEqual(new Set(out), new Set(ids))
    })
  })
}

