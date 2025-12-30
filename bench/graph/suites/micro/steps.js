function nextVertex(dataset, idx) {
  const ids = dataset.samples?.randomVertexIds || []
  if (!ids.length) return null
  return ids[(idx + 1) % ids.length]
}

async function buildEdgeEndpoints(g, edgeIds = []) {
  const map = new Map()
  const uniqueIds = Array.from(new Set(edgeIds))
  for (const edgeId of uniqueIds) {
    try {
      const [outV] = await g.E(edgeId).outV()
      const [inV] = await g.E(edgeId).inV()
      map.set(edgeId, { outV, inV })
    } catch {
      // ignore missing edges
    }
  }
  return map
}

export async function buildMicroCases({ g, dataset }) {
  const edgeEndpoints = await buildEdgeEndpoints(g, dataset.samples?.randomEdgeIds || [])
  const cases = [
    // Vertex reads
    {
      name: 'V.id()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).id(),
    },
    {
      name: 'V.label()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).label(),
    },
    {
      name: 'V.valueMap()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).valueMap(),
    },
    {
      name: 'V.properties(\"name\")',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      params: { key: 'name' },
      run: async ({ g, sample }) => sample && g.V(sample).properties('name'),
    },

    // Edge reads
    {
      name: 'E.id()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).id(),
    },
    {
      name: 'E.label()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).label(),
    },
    {
      name: 'E.valueMap()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).valueMap(),
    },
    {
      name: 'E.properties()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).properties('weight'),
    },

    // Traversal expands
    {
      name: 'V.out()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).out(),
    },
    {
      name: 'V.out() (hub)',
      kind: 'micro_step',
      sampleSet: 'hubVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).out(),
    },
    {
      name: 'V.in()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).in(),
    },
    {
      name: 'V.out().id()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).out().id(),
    },
    {
      name: 'V.out().id() (hub)',
      kind: 'micro_step',
      sampleSet: 'hubVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).out().id(),
    },
    {
      name: 'V.outE()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).outE(),
    },
    {
      name: 'V.outE().id()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).outE().id(),
    },
    {
      name: 'V.outE() (hub)',
      kind: 'micro_step',
      sampleSet: 'hubVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).outE(),
    },
    {
      name: 'V.outE().id() (hub)',
      kind: 'micro_step',
      sampleSet: 'hubVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).outE().id(),
    },
    {
      name: 'V.inE()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).inE(),
    },
    {
      name: 'V.inE() (hub)',
      kind: 'micro_step',
      sampleSet: 'hubVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).inE(),
    },
    {
      name: 'V.bothE()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).bothE(),
    },
    {
      name: 'E.inV()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).inV(),
    },
    {
      name: 'E.outV()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).outV(),
    },
    {
      name: 'E.otherV()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => {
        if (!sample) return
        const endpoints = edgeEndpoints.get(sample)
        const pivot = endpoints?.outV || endpoints?.inV
        if (!pivot) return
        await g.E(sample).otherV(pivot)
      },
    },
    {
      name: 'E.bothV()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).bothV(),
    },
    {
      name: 'E.bothV().id()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).bothV().id(),
    },

    // Filters / boolean composition
    {
      name: 'V.has(label)',
      kind: 'micro_step',
      params: { label: 'person' },
      run: async ({ g }) => g.V().has('label', 'person').limit(10),
    },
    {
      name: 'V.has(prop)',
      kind: 'micro_step',
      params: { key: 'group', value: 0 },
      run: async ({ g }) => g.V().has('group', 0).limit(10),
    },
    {
      name: 'E.has(label)',
      kind: 'micro_step',
      params: { label: 'knows' },
      run: async ({ g }) => g.E().has('label', 'knows').limit(10),
    },
    {
      name: 'E.has(prop)',
      kind: 'micro_step',
      params: { key: 'weight', value: 2 },
      run: async ({ g }) => g.E().has('weight', 2).limit(10),
    },
    {
      name: 'V.where()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).as('s').out().where((__, { value, select }) => value !== select('s')),
    },
    {
      name: 'E.where()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).where((__, { value }) => Boolean(value)),
    },
    {
      name: 'V.filter()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample, sampleIndex, dataset }) => {
        const other = nextVertex(dataset, sampleIndex)
        const ids = [sample, other].filter(Boolean)
        if (!ids.length) return
        await g.V(ids).filter((__) => __.out())
      },
    },
    {
      name: 'E.filter()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).filter((__) => __.valueMap()),
    },
    {
      name: 'V.and()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).and((__) => __.out(), (__) => __.has('group', 0)),
    },
    {
      name: 'V.or()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).or((__) => __.out(), (__) => __.has('group', 1)),
    },
    {
      name: 'V.not()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).not((__) => __.has('group', 9)),
    },
    {
      name: 'values.where()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => {
        const ids = (dataset.samples?.randomVertexIds || []).slice(0, 5)
        if (!ids.length) return
        await g.V(ids).id().where((id) => Boolean(id))
      },
    },
    {
      name: 'values.filter()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => {
        const ids = (dataset.samples?.randomVertexIds || []).slice(0, 5)
        if (!ids.length) return
        await g.V(ids).id().filter((id) => id != null)
      },
    },
    {
      name: 'values.and()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => {
        const ids = (dataset.samples?.randomVertexIds || []).slice(0, 5)
        if (!ids.length) return
        await g.V(ids).id().and((id) => typeof id === 'string', (id) => id.length > 0)
      },
    },
    {
      name: 'values.or()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => {
        const ids = (dataset.samples?.randomVertexIds || []).slice(0, 5)
        if (!ids.length) return
        await g.V(ids).id().or((id) => id.endsWith('a'), (id) => id.endsWith('b'))
      },
    },
    {
      name: 'values.not()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => {
        const ids = (dataset.samples?.randomVertexIds || []).slice(0, 5)
        if (!ids.length) return
        await g.V(ids).id().not((id) => id === ids[0])
      },
    },

    // Cardinality / limiting
    {
      name: 'V.limit()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.V(dataset.samples?.randomVertexIds || []).limit(5),
    },
    {
      name: 'E.limit()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.E(dataset.samples?.randomEdgeIds || []).limit(5),
    },
    {
      name: 'V.tail()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.V(dataset.samples?.randomVertexIds || []).tail(5),
    },
    {
      name: 'E.tail()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.E(dataset.samples?.randomEdgeIds || []).tail(5),
    },
    {
      name: 'values.limit()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.V(dataset.samples?.randomVertexIds || []).id().limit(5),
    },
    {
      name: 'values.tail()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.V(dataset.samples?.randomVertexIds || []).id().tail(5),
    },
    {
      name: 'V.count()',
      kind: 'micro_step',
      run: async ({ g }) => g.V().count(),
    },
    {
      name: 'values.count()',
      kind: 'micro_step',
      run: async ({ g, dataset }) => g.V(dataset.samples?.randomVertexIds || []).id().count(),
    },

    // Writes
    {
      name: 'addV',
      kind: 'micro_step',
      run: async ({ g }) => g.addV('bench_tmp'),
    },
    {
      name: 'addE',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample, sampleIndex, dataset }) => {
        const other = nextVertex(dataset, sampleIndex)
        if (!sample || !other) return
        await g.addE('bench_e', sample, other)
      },
    },
    {
      name: 'V.property()',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample, sampleIndex }) => sample && g.V(sample).property('bench', sampleIndex % 10),
    },
    {
      name: 'E.property()',
      kind: 'micro_step',
      sampleSet: 'randomEdgeIds',
      run: async ({ g, sample, sampleIndex }) => sample && g.E(sample).property('bench_w', sampleIndex % 5),
    },
    {
      name: 'addV + drop',
      kind: 'micro_step',
      run: async ({ g }) => {
        const [v] = await g.addV('bench_tmp')
        await g.V(v).drop()
      },
    },
    {
      name: 'addE + drop',
      kind: 'micro_step',
      sampleSet: 'randomVertexIds',
      run: async ({ g, sample, dataset, sampleIndex }) => {
        const other = nextVertex(dataset, sampleIndex)
        if (!sample || !other) return
        const [e] = await g.addE('bench_tmp', sample, other)
        await g.E(e).drop()
      },
    },
    {
      name: 'V.drop()',
      kind: 'micro_step',
      run: async ({ g }) => {
        const [v] = await g.addV('bench_tmp')
        await g.V(v).drop()
      },
    },
    {
      name: 'E.drop()',
      kind: 'micro_step',
      run: async ({ g }) => {
        const [a] = await g.addV('bench_tmp')
        const [b] = await g.addV('bench_tmp')
        const [e] = await g.addE('bench_tmp', a, b)
        await g.E(e).drop()
      },
    },
  ]

  return cases
}
