import assert from 'node:assert/strict'
import test, { suite } from 'node:test'

import { Errors } from '../../steps/types.js'

export function runHasSuite({ label, setup }) {
  suite(`has() traversal integration [${label}]`, () => {
    test('filters vertices by label', async (t) => {
      const graph = await setup(t)
      const components = []
      for (const lbl of ['component', 'service', 'component']) {
        const [id] = await graph.g.addV(lbl)
        if (lbl === 'component') components.push(id)
      }

      const filtered = await graph.g.V().has('label', 'component')
      assert.deepEqual(new Set(filtered), new Set(components))
    })

    test('preserves upstream order when filtering vertices', async (t) => {
      const graph = await setup(t)
      const ids = []
      for (const lbl of ['service', 'component', 'component']) {
        const [id] = await graph.g.addV(lbl)
        ids.push(id)
      }
      const ordered = [ids[2], ids[0], ids[1]]
      const filtered = await graph.g.V(ordered).has('label', 'component')
      assert.deepEqual(filtered, [ids[2], ids[1]])
    })

    test('filters by vertex property values', async (t) => {
      const graph = await setup(t)
      const matching = []
      for (let i = 0; i < 4; i++) {
        const [id] = await graph.g.addV('node')
        if (i % 2 === 0) {
          await graph.g.V(id).property('name', 'alpha')
          matching.push(id)
        }
      }

      const results = await graph.g.V().has('name', 'alpha')
      assert.deepEqual(new Set(results), new Set(matching))
    })

    test('filters edges by label and properties', async (t) => {
      const graph = await setup(t)
      const [[a], [b]] = await Promise.all([graph.g.addV('A'), graph.g.addV('B')])
      const [depends] = await graph.g.addE('dependsOn', a, b)
      const [uses] = await graph.g.addE('uses', a, b)
      await graph.g.E(depends).property('weight', 2)
      await graph.g.E(uses).property('weight', 1)

      const byLabel = await graph.g.V(a).outE().has('label', 'dependsOn')
      assert.deepEqual(byLabel, [depends])

      const byProp = await graph.g.E().has('weight', 1)
      assert.deepEqual(byProp, [uses])
    })

    test('rejects invalid keys or values', async (t) => {
      const graph = await setup(t)
      const [id] = await graph.g.addV('x')
      const source = graph.g.V([id])

      let keyErr
      try { await source.has('', 'v') } catch (err) { keyErr = err }
      assert.equal(keyErr?.code, Errors.HAS_INVALID_KEY)

      let valueErr
      try { await graph.g.V([id]).has('label', {}) } catch (err) { valueErr = err }
      assert.equal(valueErr?.code, Errors.HAS_INVALID_VALUE)
    })
  })
}

