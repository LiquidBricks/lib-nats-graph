import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runWhereSuite({ label, setup }) {
  suite(`where() traversal integration [${label}]`, () => {
    test('keeps items when predicate traversal yields results', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withoutEdge], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('linked', withEdge, target)

      const kept = await graph.g.V([withEdge, withoutEdge]).where((__) => __.out())

      assert.deepEqual(kept, [withEdge])
    })

    test('supports value predicates that return booleans', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])

      const keptIds = await graph.g.V([a, b]).id().where((id) => id === a)

      assert.deepEqual(keptIds, [a])
    })

    test('compares current traverser value against a labeled binding', async (t) => {
      const graph = await setup(t)
      const [[origin], [other]] = await Promise.all([
        graph.g.addV('Person'),
        graph.g.addV('Person'),
      ])
      await graph.g.addE('knows', origin, origin)
      await graph.g.addE('knows', origin, other)

      const kept = await graph.g.V(origin)
        .as('origin')
        .out('knows')
        .where((__, { value, select }) => value !== select('origin'))

      assert.deepEqual(kept, [other])
    })

    test('predicate traversals can read label bindings via select()', async (t) => {
      const graph = await setup(t)
      const [[flagged], [unflagged], [shared]] = await Promise.all([
        graph.g.addV('User'),
        graph.g.addV('User'),
        graph.g.addV('User'),
      ])
      await graph.g.addE('knows', flagged, shared)
      await graph.g.addE('knows', unflagged, shared)

      const kept = await graph.g.V([flagged, unflagged])
        .as('origin')
        .out('knows')
        .where((__) => __
          .select('origin')
          .filter((originId) => originId === flagged)
        )

      assert.deepEqual(kept, [shared])
    })

    test('raises on invalid predicate input', async (t) => {
      const graph = await setup(t)
      await assert.rejects(
        graph.g.V().where(null),
        (err) => err?.code === Errors.WHERE_INVALID_PREDICATE
      )
    })
  })
}
