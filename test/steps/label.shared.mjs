import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runLabelSuite({ label, setup }) {
  suite(`label() traversal integration [${label}]`, () => {
    test('returns the labels of vertices', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const labels = await graph.g.V([a, b]).label()
      assert.deepEqual(new Set(labels), new Set(['A', 'B']))
    })
  })
}

