import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runSelectSuite({ label, setup }) {
  suite(`select() traversal integration [${label}]`, () => {
    test('projects a single labeled value', async (t) => {
      const graph = await setup(t)
      const [[start], [next]] = await Promise.all([
        graph.g.addV('Person'),
        graph.g.addV('Person'),
      ])
      await graph.g.addE('knows', start, next)

      const out = await graph.g.V(start).as('origin').out('knows').select('origin')

      assert.deepEqual(out, [start])
    })

    test('returns an object when multiple labels are requested', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([
        graph.g.addV('Person'),
        graph.g.addV('Person'),
      ])
      await graph.g.addE('knows', a, b)

      const selections = await graph.g.V(a)
        .as('source')
        .out('knows')
        .as('target')
        .select('source', 'target')

      assert.equal(selections.length, 1)
      assert.deepEqual(selections[0], { source: a, target: b })
    })

    test('updates the traverser value so downstream path reflects the selection', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([
        graph.g.addV('Person'),
        graph.g.addV('Person'),
      ])
      await graph.g.addE('knows', a, b)

      const [path] = await graph.g.V(a)
        .as('start')
        .out('knows')
        .select('start')
        .path()

      assert.deepEqual(path, [a, b, a])
    })
  })
}
