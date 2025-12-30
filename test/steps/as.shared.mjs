import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runAsSuite({ label, setup }) {
  suite(`as() traversal integration [${label}]`, () => {
    test('labels traversers without changing streamed values', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('Person')

      const out = await graph.g.V(id).as('start')

      assert.deepEqual(out, [id])
    })

    test('records label bindings on traverser metadata', async (t) => {
      const graph = await setup(t)
      const [vertexId] = await graph.g.addV('person')

      const selections = await graph.g.V(vertexId).as('origin', 'source').select('origin', 'source')

      assert.equal(selections.length, 1)
      const [selection] = selections
      assert.deepEqual(selection, { origin: vertexId, source: vertexId })
    })

    test('preserves label snapshot after downstream traversals', async (t) => {
      const graph = await setup(t)
      const [[startId], [endId]] = await Promise.all([
        graph.g.addV('person'),
        graph.g.addV('person'),
      ])
      await graph.g.addE('knows', startId, endId)

      const traversers = await graph.g.V(startId).as('origin').out('knows')
      const selections = await graph.g.V(startId).as('origin').out('knows').select('origin')

      assert.equal(traversers.length, 1)
      const [traverser] = traversers
      assert.equal(traverser, endId)
      assert.equal(selections.length, 1)
      const [origin] = selections
      assert.equal(origin, startId)
    })
  })
}
