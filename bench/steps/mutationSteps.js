export async function registerMutationSteps({ bench, g }) {


  const [v1] = await g.addV('bench_src')
  const [v2] = await g.addV('bench_dst')

  bench.add('addV', async () => {
    await g.addV('bench_v')
  })

  bench.add('addE', async () => g.addE('bench_e', v1, v2))

  bench.add('addV + drop', async () => {
    const [v] = await g.addV('bench_v')
    await g.V(v).drop()
  })

  bench.add('addE + drop', async () => {
    const [e] = await g.addE('bench_e', v1, v2)
    await g.E(e).drop()
  })

  bench.add('V.property + has()', async () => {
    const [v] = await g.addV('p')
    await g.V(v).property('x', 1)
    const out = await g.V(v).has('x', 1)
    if (out.length !== 1) throw new Error('has failed')
    await g.V(v).drop()
  })
}
