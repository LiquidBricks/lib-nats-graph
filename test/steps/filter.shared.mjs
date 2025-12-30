import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runFilterSuite({ label, setup }) {
  suite(`filter() traversal integration [${label}]`, () => {
    test('keeps items when predicate traversal yields results', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withoutEdge], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('linked', withEdge, target)

      const kept = await graph.g.V([withEdge, withoutEdge]).filter((__) => __.out())
      assert.deepEqual(kept, [withEdge])
    })

    test('uses predicate-returned result when provided', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])

      const keptIds = await graph.g.V([a, b]).id().filter((id) => Promise.resolve(id === a))
      assert.deepEqual(keptIds, [a])
    })

    test('falls back to traversal evaluation when predicate returns undefined', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withoutEdge], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('linked', withEdge, target)

      const kept = await graph.g.V([withEdge, withoutEdge]).filter((__) => { __.out() })
      assert.deepEqual(kept, [withEdge])
    })

    test('raises on invalid predicate', async (t) => {
      const graph = await setup(t)
      await assert.rejects(
        graph.g.V().filter(null),
        (err) => err?.code === Errors.FILTER_INVALID_PREDICATE
      )
    })
  })
}
