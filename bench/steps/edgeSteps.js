export async function registerEdgeSteps({ bench, g }) {
  const [center] = await g.addV('center')
  const cv = g.V(center)
  for (let i = 0; i < 5; i++) {
    const [nv] = await g.addV('n')
    await g.addE('link', center, nv)
  }

  bench.add('V.outE().id()', async () => {
    await cv.outE().id()
  })

  bench.add('V.out().id()', async () => {
    await cv.out().id()
  })

  const [edgeSrc] = await g.addV('edge_src')
  const [edgeDst] = await g.addV('edge_dst')
  const [edge1] = await g.addE('one', edgeSrc, edgeDst)

  bench.add('E.outV().id()', async () => {
    await g.E(edge1).outV().id()
  })

  bench.add('E.inV().id()', async () => {
    await g.E(edge1).inV().id()
  })

  const batchEdges = []
  for (let i = 0; i < 10; i++) {
    const [sx] = await g.addV('s')
    const [tx] = await g.addV('t')
    const [ex] = await g.addE('b', sx, tx)
    batchEdges.push(ex)
  }
  bench.add('E.limit()', async () => {
    await g.E(batchEdges).limit(5)
  })
  bench.add('E.tail()', async () => {
    await g.E(batchEdges).tail(3)
  })
  bench.add('E.filter()', async () => {
    await g.E(batchEdges).filter((__) => __.has('label', 'b'))
  })
  bench.add('E.where()', async () => {
    await g.E(batchEdges).where((__) => __.has('label', 'b'))
  })

  const [a] = await g.addV('A')
  const [b] = await g.addV('B')
  const [eCreated] = await g.addE('t', a, b)
  await g.E(eCreated).property('w', 1)

  const edgeTraversal = g.E(eCreated)

  bench.add('E.id()', async () => { await edgeTraversal.id() })
  bench.add('E.label()', async () => { await edgeTraversal.label() })
  bench.add('E.properties()', async () => { await edgeTraversal.properties('w') })
  bench.add('E.valueMap()', async () => { await edgeTraversal.valueMap() })
  bench.add('E.has(label)', async () => { await edgeTraversal.has('label', 't') })
  bench.add('E.has(prop)', async () => { await edgeTraversal.has('w', 1) })
  bench.add('E.property()', async () => { await edgeTraversal.property('w2', 2) })
  bench.add('E.outV()', async () => { await edgeTraversal.outV() })
  bench.add('E.inV()', async () => { await edgeTraversal.inV() })
  bench.add('E.bothV()', async () => { await edgeTraversal.bothV() })
  bench.add('E.otherV()', async () => { await edgeTraversal.otherV(a) })
  bench.add('E.drop()', async () => {
    const [x] = await g.addV('x');
    const [y] = await g.addV('y');
    const [ee] = await g.addE('d', x, y);
    await g.E(ee).drop()
  })
}
