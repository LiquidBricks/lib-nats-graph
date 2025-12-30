import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runAndSuite({ label, setup }) {
  suite(`and() traversal integration [${label}]`, () => {
    test('keeps items only when all predicate traversals match', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withoutEdge], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('linked', withEdge, target)

      const kept = await graph.g.V([withEdge, withoutEdge]).and(
        (__) => __.out(),
        (__) => __.has('label', 'node')
      )
      assert.deepEqual(kept, [withEdge])
    })

    test('uses predicate-returned result when provided', async (t) => {
      const graph = await setup(t)
      const [[passes], [fails], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('rel', passes, target)

      const kept = await graph.g.V([passes, fails]).and(
        () => Promise.resolve(true),
        (__) => __.out()
      )
      assert.deepEqual(kept, [passes])
    })

    test('applies and() after a value-producing step', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])

      const keptIds = await graph.g.V([a, b, c]).id().and(
        (id) => id === a || id === c,
        async (id) => [a, c].includes(id)
      )
      assert.deepEqual(new Set(keptIds), new Set([a, c]))
    })

    test('raises on invalid predicates', async (t) => {
      const graph = await setup(t)
      await assert.rejects(
        graph.g.V().and(null),
        (err) => err?.code === Errors.AND_INVALID_PREDICATE
      )
    })
  })
}
