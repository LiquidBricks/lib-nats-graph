import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runOutSuite({ label, setup }) {
  suite(`out() traversal integration [${label}]`, () => {
    test('traverses outgoing edges to vertices', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B'), graph.g.addV('C')])
      await graph.g.addE('rel', a, b)
      await graph.g.addE('rel', a, c)
      const outgoing = await graph.g.V(a).out()
      assert.deepEqual(new Set(outgoing), new Set([b, c]))
    })

    test('traverses any outgoing edge matching provided labels', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c], [d], [e]] = await Promise.all([
        graph.g.addV('A'),
        graph.g.addV('B'),
        graph.g.addV('C'),
        graph.g.addV('D'),
        graph.g.addV('E')
      ])

      await graph.g.addE('friend', a, b)
      await graph.g.addE('friend', a, c)
      await graph.g.addE('colleague', a, d)
      await graph.g.addE('teammate', a, e)

      const outgoing = await graph.g.V(a).out('friend', 'colleague')
      assert.deepEqual(new Set(outgoing), new Set([b, c, d]))
    })
  })
}
