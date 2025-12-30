import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runAddESuite({ label, setup }) {
  suite(`addE() traversal integration [${label}]`, () => {
    test('creates an edge lazily and links the provided vertices', async (t) => {
      const graph = await setup(t)
      const [[from], [to]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [initial] = await graph.g.E().count()

      const traversal = graph.g.addE('rel', from, to)
      const [beforeAwait] = await graph.g.E().count()
      assert.equal(beforeAwait, initial)

      const [edgeId] = await traversal
      const [after] = await graph.g.E().count()
      assert.equal(after, initial + 1)

      const [label] = await graph.g.E(edgeId).label()
      assert.equal(label, 'rel')

      const [outV] = await graph.g.E(edgeId).outV()
      const [inV] = await graph.g.E(edgeId).inV()
      assert.equal(outV, from)
      assert.equal(inV, to)
    })

    test('produces unique ids across multiple creations', async (t) => {
      const graph = await setup(t)
      const ids = new Set()
      const [a] = await graph.g.addV('src')
      const [b] = await graph.g.addV('dst')

      const k = 4
      for (let i = 0; i < k; i++) {
        const [id] = await graph.g.addE('t', a, b)
        ids.add(id)
      }
      assert.equal(ids.size, k)
    })

    test('bulk creation increments the edge count', async (t) => {
      const graph = await setup(t)
      const [v1] = await graph.g.addV('S')
      const [v2] = await graph.g.addV('T')
      const [before] = await graph.g.E().count()

      const k = 3
      for (let i = 0; i < k; i++) await graph.g.addE('multi', v1, v2)

      const [after] = await graph.g.E().count()
      assert.equal(after, before + k)
    })

    test('rejects missing or invalid labels/endpoints', async (t) => {
      const graph = await setup(t)
      const [a] = await graph.g.addV('A')
      const [b] = await graph.g.addV('B')

      await assert.rejects(graph.g.addE(), (err) => err?.code === Errors.EDGE_LABEL_REQUIRED)
      await assert.rejects(graph.g.addE('t'), (err) => err?.code === Errors.EDGE_INCOMING_REQUIRED)
      await assert.rejects(graph.g.addE('t', a), (err) => err?.code === Errors.EDGE_OUTGOING_REQUIRED)

      for (const bad of [null, undefined, {}, 123, '']) {
        await assert.rejects(graph.g.addE(bad, a, b), (err) => err?.code === Errors.EDGE_LABEL_REQUIRED)
        await assert.rejects(graph.g.addE('t', bad, b), (err) => err?.code === Errors.EDGE_INCOMING_REQUIRED)
        await assert.rejects(graph.g.addE('t', a, bad), (err) => err?.code === Errors.EDGE_OUTGOING_REQUIRED)
      }
    })

    test('rejects non-existent endpoints with specific errors', async (t) => {
      const graph = await setup(t)
      const [present] = await graph.g.addV('present')
      await assert.rejects(graph.g.addE('t', 'missing-in', 'missing-out'), (err) => err?.code === Errors.EDGE_INCOMING_MISSING)
      await assert.rejects(graph.g.addE('t', present, 'missing-out'), (err) => err?.code === Errors.EDGE_OUTGOING_MISSING)
    })
  })
}

