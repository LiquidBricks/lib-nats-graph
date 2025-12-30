import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runAddVSuite({ label, setup }) {
  suite(`addV() traversal integration [${label}]`, () => {
    test('adds a vertex and returns its id', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('component')
      assert.ok(id)
    })

    test('maintains insertion order in V()', async (t) => {
      const graph = await setup(t)
      const order = []
      for (const lbl of ['component', 'service', 'component']) {
        const [id] = await graph.g.addV(lbl)
        order.push(id)
      }
      const out = await graph.g.V()
      assert.deepEqual(out, order)
    })
  })
}

