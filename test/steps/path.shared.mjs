import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

const normalizePaths = (paths) => paths
  .map((p) => p.map(String).join('>'))
  .sort()

export function runPathSuite({ label, setup }) {
  suite(`path() traversal integration [${label}]`, () => {
    test('captures the sequence of vertices in a traversal', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([
        graph.g.addV('A'),
        graph.g.addV('B'),
        graph.g.addV('C'),
      ])
      await graph.g.addE('knows', a, b)
      await graph.g.addE('created', b, c)

      const paths = await graph.g.V(a).out('knows').out('created').path()

      assert.deepEqual(paths, [[a, b, c]])
    })

    test('emits independent paths for branching traversers', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([
        graph.g.addV('A'),
        graph.g.addV('B'),
        graph.g.addV('C'),
      ])
      await graph.g.addE('knows', a, b)
      await graph.g.addE('knows', a, c)

      const paths = await graph.g.V(a).out('knows').path()

      const expected = normalizePaths([[a, b], [a, c]])
      assert.deepEqual(normalizePaths(paths), expected)
    })

    test('includes edges when traversing through them', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [edgeId] = await graph.g.addE('link', a, b)

      const [path] = await graph.g.V(a).outE('link').inV().path()

      assert.deepEqual(path, [a, edgeId, b])
    })
  })
}
