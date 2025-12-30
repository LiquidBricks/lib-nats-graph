import { Bench } from 'tinybench'
import { kvProviderFactory } from '../kvProvider/factory.js'
import { diagnostics as createDiagnostics } from '@liquid-bricks/lib-diagnostics'
import { PROVIDER_BENCH_CONFIG } from './benchConfigs.js'

// Provider-level benchmarks for raw KV interface functions.
export async function createProviderBench({ provider, kvConfig, benchConfig = PROVIDER_BENCH_CONFIG }) {
  const diagnostics = createDiagnostics().child({ suite: 'provider-bench', provider })
  const kvProvider = kvProviderFactory(provider)
  const kvStore = await kvProvider({ config: kvConfig, ctx: { diagnostics } })
  const kv = kvStore.interface

  const bench = new Bench(benchConfig)
  const capturedTasks = []
  const originalAdd = bench.add.bind(bench)
  bench.add = (name, fn) => {
    capturedTasks.push({ name, fn })
    return bench
  }
  const prefix = `bench_${provider}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  let createCounter = 0
  let putCounter = 0
  let updateCounter = 0

  const putKey = `${prefix}_put`
  const updateKey = `${prefix}_update`
  let updateRev = await kv.create(updateKey, 'init')

  const getKey = `${prefix}_get`
  await kv.put(getKey, 'getval')

  const deleteKey = `${prefix}_delete`
  await kv.put(deleteKey, 'delval')

  const keysPrefix = `${prefix}.keys`
  for (let i = 0; i < 10; i++) {
    await kv.put(`${keysPrefix}.${i}`, `v${i}`)
  }

  bench.add('kv.create', async () => {
    const key = `${prefix}_create_${createCounter++}`
    await kv.create(key, 'v')
  })

  bench.add('kv.put', async () => {
    await kv.put(putKey, `v${putCounter++}`)
  })

  bench.add('kv.update', async () => {
    updateRev = await kv.update(updateKey, `v${updateCounter++}`, updateRev)
  })

  bench.add('kv.get', async () => {
    await kv.get(getKey)
  })

  bench.add('kv.delete', async () => {
    await kv.delete(deleteKey)
  })

  bench.add('kv.keys', async () => {
    const itr = await kv.keys(`${keysPrefix}.*`)
    const collected = []
    for await (const k of itr) collected.push(k)
  })

  bench.add = originalAdd
  const totalTasks = capturedTasks.length
  capturedTasks.forEach(({ name, fn }, idx) => {
    let started = false
    bench.add(name, async function (...args) {
      if (!started) {
        console.log(`[${idx + 1}/${totalTasks}] Running provider task "${name}"`)
        started = true
      }
      return fn.apply(this, args)
    })
  })

  return { bench, kvStore }
}
