import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runInESuite({ label, setup }) {
  suite(`inE() traversal integration [${label}]`, () => {
    test('lists incoming edges for a vertex', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B'), graph.g.addV('C')])
      const [ab] = await graph.g.addE('rel', a, b)
      const [cb] = await graph.g.addE('rel', c, b)
      const edges = await graph.g.V(b).inE()
      assert.deepEqual(new Set(edges), new Set([ab, cb]))
    })
  })
}

