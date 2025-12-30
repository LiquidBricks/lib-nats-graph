import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runCountSuite({ label, setup }) {
  suite(`count() traversal integration [${label}]`, () => {
    test('counts vertices', async (t) => {
      const graph = await setup(t)
      await graph.g.addV('node')
      await graph.g.addV('node')
      const [count] = await graph.g.V().count()
      assert.equal(count, 2)
    })

    test('counts zero vertices on an empty graph', async (t) => {
      const graph = await setup(t)
      const [count] = await graph.g.V().count()
      assert.equal(count, 0)
    })

    test('counts edges', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      await graph.g.addE('link', a, b)
      const [count] = await graph.g.E().count()
      assert.equal(count, 1)
    })

    test('counts zero edges on an empty graph', async (t) => {
      const graph = await setup(t)
      const [count] = await graph.g.E().count()
      assert.equal(count, 0)
    })
  })
}
