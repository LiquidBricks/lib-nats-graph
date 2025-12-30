import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runPropertiesSuite({ label, setup }) {
  suite(`properties() traversal integration [${label}]`, () => {
    test('returns vertex properties', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')
      await graph.g.V(id).property('name', 'alpha')
      await graph.g.V(id).property('version', '1.0')

      const props = await graph.g.V(id).properties()
      assert.deepEqual(new Set(props), new Set(['name', 'version']))
    })
  })
}

