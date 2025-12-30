import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runValueMapSuite({ label, setup }) {
  suite(`valueMap() traversal integration [${label}]`, () => {
    test('returns maps of vertex properties', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')
      await graph.g.V(id).property('name', 'alpha')
      await graph.g.V(id).property('version', '1.0')

      const [vm] = await graph.g.V(id).valueMap()
      assert.deepEqual(vm, { name: 'alpha', version: '1.0' })
    })

    test('filters properties when keys are provided', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')
      await graph.g.V(id).property('name', 'alpha')
      await graph.g.V(id).property('version', '1.0')

      const [vm] = await graph.g.V(id).valueMap('name')
      assert.deepEqual(vm, { name: 'alpha' })
    })

    test('returns id/label when explicitly requested as keys', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')
      await graph.g.V(id).property('name', 'alpha')

      const [vm] = await graph.g.V(id).valueMap('id', 'label', 'name')
      assert.deepEqual(vm, { id, label: 'node', name: 'alpha' })
    })
  })
}
