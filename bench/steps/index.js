import { Bench } from 'tinybench'
import { registerMutationSteps } from './mutationSteps.js'
import { registerEdgeSteps } from './edgeSteps.js'
import { registerVertexSteps } from './vertexSteps.js'
import { STEP_BENCH_CONFIG } from '../benchConfigs.js'

export async function createBench(g) {
  const bench = new Bench(STEP_BENCH_CONFIG)
  const capturedSteps = []
  const originalAdd = bench.add.bind(bench)
  bench.add = (name, fn) => {
    capturedSteps.push({ name, fn })
    return bench
  }

  await registerMutationSteps({ bench, g })
  await registerEdgeSteps({ bench, g })
  await registerVertexSteps({ bench, g })

  bench.add = originalAdd
  const totalSteps = capturedSteps.length
  capturedSteps.forEach(({ name, fn }, idx) => {
    let started = false
    bench.add(name, async function (...args) {
      if (!started) {
        console.log(`[${idx + 1}/${totalSteps}] Running graph task "${name}"`)
        started = true
      }
      return fn.apply(this, args)
    })
  })

  return bench
}
