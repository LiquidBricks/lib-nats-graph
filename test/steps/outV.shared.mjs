import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runOutVSuite({ label, setup }) {
  suite(`outV() traversal integration [${label}]`, () => {
    test('walks to the outgoing vertex of an edge', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [edgeId] = await graph.g.addE('rel', a, b)
      const [outgoing] = await graph.g.E(edgeId).outV()
      assert.equal(outgoing, a)
    })
  })
}

