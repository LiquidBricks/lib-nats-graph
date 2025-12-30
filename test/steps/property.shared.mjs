import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runPropertySuite({ label, setup }) {
  suite(`property() traversal integration [${label}]`, () => {
    test('sets and overwrites vertex properties', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')

      const [ret] = await graph.g.V(id).property('name', 'alpha')
      assert.equal(ret, id)

      const [first] = await graph.g.V(id).valueMap('name')
      assert.deepEqual(first, { name: 'alpha' })

      await graph.g.V(id).property('name', 'beta')
      const [second] = await graph.g.V(id).valueMap('name')
      assert.deepEqual(second, { name: 'beta' })
    })

    test('sets edge properties', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [edgeId] = await graph.g.addE('rel', a, b)

      await graph.g.E(edgeId).property('weight', 3)
      const [vm] = await graph.g.E(edgeId).valueMap('weight')
      assert.deepEqual(vm, { weight: 3 })
    })

    test('rejects reserved or invalid keys/values', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('node')

      await assert.rejects(graph.g.V(id).property('', 'x'), (err) => err?.code === Errors.PROPERTY_INVALID_KEY)
      await assert.rejects(graph.g.V(id).property('id', 'x'), (err) => err?.code === Errors.PROPERTY_RESERVED_KEY)
      await assert.rejects(graph.g.V(id).property('name', undefined), (err) => err?.code === Errors.PROPERTY_INVALID_VALUE)
    })
  })
}

