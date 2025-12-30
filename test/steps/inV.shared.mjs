import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runInVSuite({ label, setup }) {
  suite(`inV() traversal integration [${label}]`, () => {
    test('walks to the incoming vertex of an edge', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [edgeId] = await graph.g.addE('rel', a, b)
      const [incoming] = await graph.g.E(edgeId).inV()
      assert.equal(incoming, b)
    })
  })
}

