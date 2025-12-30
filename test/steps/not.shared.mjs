import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runNotSuite({ label, setup }) {
  suite(`not() traversal integration [${label}]`, () => {
    test('filters vertices when predicate traversal yields results', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('rel', a, b)

      const results = await graph.g.V([a, b, c]).not((__) => __.out())
      assert.deepEqual(new Set(results), new Set([b, c]))
    })

    test('filters edges based on inner predicate traversal', async (t) => {
      const graph = await setup(t)
      const [[src], [dst]] = await Promise.all([graph.g.addV('src'), graph.g.addV('dst')])
      const [archived] = await graph.g.addE('edge', src, dst)
      await graph.g.E(archived).property('archived', true)
      const [active] = await graph.g.addE('edge', src, dst)

      const kept = await graph.g.E([archived, active]).not((__) => __.has('archived', true))
      assert.deepEqual(kept, [active])
    })

    test('uses predicate-returned result instead of traversal when provided', async (t) => {
      const graph = await setup(t)
      const [vertex] = await graph.g.addV('node')

      const kept = await graph.g.V(vertex).not(() => Promise.resolve(false))
      assert.deepEqual(kept, [vertex])
    })

    test('falls back to traversal evaluation when predicate returns undefined', async (t) => {
      const graph = await setup(t)
      const [[withEdge], [withoutEdge], [target]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])
      await graph.g.addE('knows', withEdge, target)

      const kept = await graph.g.V([withEdge, withoutEdge]).not((__) => { __.out() })
      assert.deepEqual(kept, [withoutEdge])
    })

    test('handles async iterable predicate results', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('node'), graph.g.addV('node')])

      const emptyAsyncIter = async function* () { /* yields nothing */ }
      const valueAsyncIter = async function* () { yield 1 }

      const kept = await graph.g.V([a, b]).id().not((id) =>
        id === a ? emptyAsyncIter() : valueAsyncIter()
      )
      assert.deepEqual(kept, [a])
    })

    test('handles sync iterable predicate results', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('node'), graph.g.addV('node')])

      const emptyIter = () => []
      const valueIter = () => [1]

      const kept = await graph.g.V([a, b]).id().not((id) =>
        id === a ? emptyIter() : valueIter()
      )
      assert.deepEqual(kept, [a])
    })

    test('raises on invalid predicate', async (t) => {
      const graph = await setup(t)
      await assert.rejects(
        graph.g.V().not(null),
        (err) => err?.code === Errors.NOT_INVALID_PREDICATE
      )
    })

    test('applies not() after a value-producing step', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([
        graph.g.addV('node'),
        graph.g.addV('node'),
        graph.g.addV('node'),
      ])

      const keptIds = await graph.g.V([a, b, c]).id().not((id) => id === b)
      assert.deepEqual(new Set(keptIds), new Set([a, c]))
    })
  })
}
