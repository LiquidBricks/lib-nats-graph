import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

export function runOutESuite({ label, setup }) {
  suite(`outE() traversal integration [${label}]`, () => {
    test('lists outgoing edges for a vertex', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B'), graph.g.addV('C')])
      const [ab] = await graph.g.addE('rel', a, b)
      const [ac] = await graph.g.addE('rel', a, c)
      const edges = await graph.g.V(a).outE()
      assert.deepEqual(new Set(edges), new Set([ab, ac]))
    })

    test('filters outgoing edges by label', async (t) => {
      const graph = await setup(t)
      const [[a], [b], [c], [d]] = await Promise.all([
        graph.g.addV('A'),
        graph.g.addV('B'),
        graph.g.addV('C'),
        graph.g.addV('D')
      ])
      const [ab] = await graph.g.addE('friend', a, b)
      const [ac] = await graph.g.addE('friend', a, c)
      await graph.g.addE('colleague', a, d)

      const edges = await graph.g.V(a).outE('friend')
      assert.deepEqual(new Set(edges), new Set([ab, ac]))
    })

    test('returns all edges after concurrent addE operations (race check)', async (t) => {
      const graph = await setup(t)
      const label = 'domain.edge.has_data_state.stateMachine__data'
      const [[stateMachine], [d1], [d2], [d3]] = await Promise.all([
        graph.g.addV('stateMachine'),
        graph.g.addV('data'),
        graph.g.addV('data'),
        graph.g.addV('data'),
      ])

      // Create multiple edges concurrently to simulate real usage
      const created = await Promise.all([
        graph.g.addE(label, stateMachine, d1),
        graph.g.addE(label, stateMachine, d2),
        graph.g.addE(label, stateMachine, d3),
      ])
      const expectedIds = created.map(([id]) => id)

      // outE(label) should list all three edges
      const observed = await graph.g.V(stateMachine).outE(label).id()
      assert.deepEqual(new Set(observed), new Set(expectedIds))
    })
  })
}
