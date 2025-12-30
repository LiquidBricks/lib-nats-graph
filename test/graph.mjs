import assert from 'node:assert'
import test, { after, suite } from 'node:test'
import { Graph } from '../graph/graph.js'
import { NATS_IP_ADDRESS } from './util/config.js'
import { ulid } from 'ulid'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'
import { Errors } from '../steps/types.js'
import buildMeta from '../build-meta.js'

suite('Graph diagnostics configuration', () => {
  test('falls back to default diagnostics when missing', async (t) => {
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())
    await assert.rejects(
      graph.g.addV().count(),
      (err) => err?.code === Errors.VERTEX_LABEL_REQUIRED && err?.name === 'DiagnosticError'
    )
  })

  test('uses diagnostics provided via config', async (t) => {
    const trackingDiagnostics = createDiagnostics()
    trackingDiagnostics.child = () => trackingDiagnostics
    const calls = []
    const originalRequire = trackingDiagnostics.require.bind(trackingDiagnostics)
    trackingDiagnostics.require = (...args) => {
      calls.push(args)
      return originalRequire(...args)
    }
    const graph = Graph({ kv: 'memory', diagnostics: trackingDiagnostics })
    t.after(async () => graph.close?.())
    await assert.rejects(
      graph.g.addV().count(),
      (err) => err?.code === Errors.VERTEX_LABEL_REQUIRED
    )
    assert.ok(
      calls.some(([, code]) => code === Errors.VERTEX_LABEL_REQUIRED),
      'custom diagnostics instance should receive require calls'
    )
  })

  test('diagnostic errors include query and failing step metadata', async (t) => {
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())

    const queryMetaKey = `${buildMeta.packageHash}-query`
    const stepMetaKey = `${buildMeta.packageHash}-step`

    await assert.rejects(
      graph.g.addV('person').property('id', 'secret'),
      (err) => {
        assert.equal(err?.code, Errors.PROPERTY_RESERVED_KEY)
        console.log(err.meta)
        const queryMeta = err?.meta?.[queryMetaKey]
        assert.ok(queryMeta, 'diagnostic error should include query metadata')
        assert.equal(typeof queryMeta.id, 'string')
        assert.equal(queryMeta.id.length, 26)
        assert.deepEqual(queryMeta.query, [
          { prop: 'Graph', args: [] },
          { prop: 'addV', args: ['person'] },
          { prop: 'property', args: ['id', 'secret'] },
        ])

        const stepMeta = err?.meta?.[stepMetaKey]
        assert.ok(stepMeta, 'diagnostic error should include step metadata')
        assert.equal(stepMeta.prop, 'property')
        assert.deepEqual(stepMeta.args, ['id', 'secret'])
        assert.equal(stepMeta.index, 2)
        return true
      }
    )
  })

})


suite('Graph configuration', () => {
  suite('incomplete', () => {
    test('should exit immediately when kv incorrect', () => {
      assert.throws(() => Graph())
      assert.throws(() => Graph({ kv: 'idk' }))
    })
    test('should return immediately when kv is specified', async (t) => {
      let graph;
      after(async () => graph.close?.())
      assert.doesNotThrow(() => {
        graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `test-${ulid()}` } })
      })
      const { g } = graph
      assert.ok(g)
      assert.ok(typeof g.V === 'function')
    })
    test('should allow memory kv and provide a usable g', async (t) => {
      let graph;
      after(async () => graph.close?.())
      assert.doesNotThrow(() => {
        graph = Graph({ kv: 'memory' })
      })
      const { g } = graph
      assert.ok(g)
      const [n] = await g.V().count()
      assert.equal(n, 0)
    })
  })
})


suite('Graph end-to-end traversals', () => {
  const requireNats = (t) => {
    assert.ok(NATS_IP_ADDRESS, 'NATS_IP_ADDRESS missing; check test/.env')
  }

  test('V().count() on empty bucket is 0', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())
    const [n] = await graph.g.V().count()
    assert.equal(n, 0)
  })

  test('addV + property then V().has(k,v).count()', async (t) => {
    requireNats(t)
    const bucket = `e2e-${ulid()}`
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket } })
    t.after(async () => graph.close?.())
    // create three persons, two named Alice
    const [p1] = await graph.g.addV('person').property('name', 'Alice')
    const [p2] = await graph.g.addV('person').property('name', 'Bob')
    const [p3] = await graph.g.addV('person').property('name', 'Alice')
    assert.ok(p1 && p2 && p3)

    // all vertices
    const [total] = await graph.g.V().count()
    assert.equal(total, 3)

    // by label
    const [byLabel] = await graph.g.V().has('label', 'person').count()
    assert.equal(byLabel, 3)

    // by property
    const [aliceCount] = await graph.g.V().has('name', 'Alice').count()
    assert.equal(aliceCount, 2)

    const [bobCount] = await graph.g.V().has('name', 'Bob').count()
    assert.equal(bobCount, 1)
  })

  test('V(id).has("id", id).count() -> 1', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())
    const [id] = await graph.g.addV('node')
    const [n] = await graph.g.V(id).has('id', id).count()
    assert.equal(n, 1)
  })

  test('V(id).count() -> 1; V(missing).count() -> 0', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())

    const [id] = await graph.g.addV('node')
    const [one] = await graph.g.V(id).count()
    assert.equal(one, 1)

    const [zero] = await graph.g.V('does-not-exist').count()
    assert.equal(zero, 0)
  })

  test('out(label) chained from addE and counted', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())
    const [a] = await graph.g.addV('A').property('name', 'src')
    const [b] = await graph.g.addV('B').property('name', 'dst')
    const [e] = await graph.g.addE('rel', a, b)
    assert.ok(e)

    const [nOutAny] = await graph.g.V(a).out().count()
    assert.equal(nOutAny, 1)

    const [nOutRel] = await graph.g.V(a).out('rel').count()
    assert.equal(nOutRel, 1)

    const [nOutWrong] = await graph.g.V(a).out('other').count()
    assert.equal(nOutWrong, 0)
  })

  test('limit before count limits result size', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())
    // create 5 vertices
    await graph.g.addV('X'); await graph.g.addV('X'); await graph.g.addV('X'); await graph.g.addV('X'); await graph.g.addV('X')

    const [nAll] = await graph.g.V().count()
    assert.equal(nAll, 5)

    const [nLimited] = await graph.g.V().limit(2).count()
    assert.equal(nLimited, 2)
  })

  test('concurrent traversals with destructured g resolve correctly', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'nats', kvConfig: { servers: NATS_IP_ADDRESS, bucket: `e2e-${ulid()}` } })
    t.after(async () => graph.close?.())

    const { g } = graph
    // seed data
    await g.addV('person').property('name', 'Alice')
    await g.addV('person').property('name', 'Bob')

    // fire multiple traversals concurrently using the same destructured g
    const pAll = g.V().count()
    const pAlice = g.V().has('name', 'Alice').count()
    const pBob = g.V().has('name', 'Bob').count()

    const [[nAll], [nAlice], [nBob]] = await Promise.all([pAll, pAlice, pBob])
    assert.equal(nAll, 2)
    assert.equal(nAlice, 1)
    assert.equal(nBob, 1)
  })
  test('reuse single g instance across multiple traversals', async (t) => {
    requireNats(t)
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())
    const { g } = graph

    const [alice] = await g.addV('person').property('name', 'Alice')
    const [bob] = await g.addV('person').property('name', 'Bob')
    assert.ok(alice && bob)

    const [total1] = await g.V().count()
    assert.equal(total1, 2)

    const [nAlice] = await g.V().has('name', 'Alice').count()
    assert.equal(nAlice, 1)

    // Create an edge and traverse using the same g
    const [e] = await g.addE('knows', alice, bob)
    assert.ok(e)

    const [outAny] = await g.V(alice).out().count()
    assert.equal(outAny, 1)
    const [outLabel] = await g.V(alice).out('knows').count()
    assert.equal(outLabel, 1)

    // After prior traversals, g can still start a fresh chain
    const [total2] = await g.V().count()
    assert.equal(total2, 2)
  })
})

suite('Graph end-to-end traversals (memory kv)', () => {
  test('V().count() on empty graph is 0', async (t) => {
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())
    const [n] = await graph.g.V().count()
    assert.equal(n, 0)
  })

  test('addV + property then V().has(k,v).count()', async (t) => {
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())
    const [p1] = await graph.g.addV('person').property('name', 'Alice')
    const [p2] = await graph.g.addV('person').property('name', 'Bob')
    const [p3] = await graph.g.addV('person').property('name', 'Alice')
    assert.ok(p1 && p2 && p3)

    const [total] = await graph.g.V().count()
    assert.equal(total, 3)

    const [byLabel] = await graph.g.V().has('label', 'person').count()
    assert.equal(byLabel, 3)

    const [aliceCount] = await graph.g.V().has('name', 'Alice').count()
    assert.equal(aliceCount, 2)
  })

  test('concurrent traversals with destructured g resolve correctly (memory)', async (t) => {
    const graph = Graph({ kv: 'memory' })
    t.after(async () => graph.close?.())

    const { g } = graph
    await g.addV('person').property('name', 'Alice')
    await g.addV('person').property('name', 'Bob')

    const pAll = g.V().count()
    const pAlice = g.V().has('name', 'Alice').count()
    const pBob = g.V().has('name', 'Bob').count()

    const [[nAll], [nAlice], [nBob]] = await Promise.all([pAll, pAlice, pBob])
    assert.equal(nAll, 2)
    assert.equal(nAlice, 1)
    assert.equal(nBob, 1)
  })
})
