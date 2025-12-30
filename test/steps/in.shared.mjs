import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runInSuite({ label, setup }) {
  suite(`in() traversal integration [${label}]`, () => {
    test('traverses incoming edges to vertices', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B'), graph.g.addV('C')])
      await graph.g.addE('rel', a, b)
      await graph.g.addE('rel', c, b)
      const incoming = await graph.g.V(b).in()
      assert.deepEqual(new Set(incoming), new Set([a, c]))
    })
  })
}

