import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runGraphSuite({ label, setup }) {
  suite(`Graph proxy [${label}]`, () => {
    test('allows traversals via g that resolve to arrays', async (t) => {
      const graph = await setup(t)
      const vertices = await graph.g.V()
      assert.deepEqual(vertices, [])

      const [id] = await graph.g.addV('node')
      const all = await graph.g.V()
      assert.deepEqual(all, [id])
    })
  })
}

