import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runDropSuite({ label, setup }) {
  suite(`drop() traversal integration [${label}]`, () => {
    test('removes vertices', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')
      const [before] = await graph.g.V().count()
      assert.equal(before, 1)
      await graph.g.V(id).drop()
      const [after] = await graph.g.V().count()
      assert.equal(after, 0)
    })

    test('removes edges', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [edgeId] = await graph.g.addE('rel', a, b)
      const [before] = await graph.g.E().count()
      assert.equal(before, 1)
      await graph.g.E(edgeId).drop()
      const [after] = await graph.g.E().count()
      assert.equal(after, 0)
    })
  })
}

