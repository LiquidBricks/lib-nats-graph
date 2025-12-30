import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runOrSuite({ label, setup }) {
  suite(`or() traversal integration [${label}]`, () => {
    test('keeps items when any predicate traversal matches', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withFlag], [withoutMatch], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('linked', withEdge, target)
      await graph.g.V(withFlag).property('flag', true)

      const kept = await graph.g.V([withEdge, withFlag, withoutMatch]).or(
        (__) => __.out(),
        (__) => __.has('flag', true)
      )
      assert.deepEqual(new Set(kept), new Set([withEdge, withFlag]))
    })

    test('uses predicate-returned result when provided', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])

      const keptIds = await graph.g.V([a, b]).id().or(
        (id) => id === a,
        () => Promise.resolve(false)
      )
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

      const kept = await graph.g.V([withEdge, withoutEdge]).or((__) => { __.out() })
      assert.deepEqual(kept, [withEdge])
    })

    test('raises on invalid predicates', async (t) => {
      const graph = await setup(t)
      await assert.rejects(
        graph.g.V().or(null),
        (err) => err?.code === Errors.OR_INVALID_PREDICATE
      )
    })
  })
}
