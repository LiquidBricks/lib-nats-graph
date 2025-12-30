#!/usr/bin/env node
import path from 'node:path'
import { runMicroSuite } from './suites/micro/index.js'
import { runWorkloadSuite } from './suites/workload/index.js'
import { runScaleSuite, resolveScaleSizes, resolveScaleTopologies, SCALE_DEFAULTS } from './suites/scale/index.js'
import { createRunDirectory, appendJsonl, writeMeta, writeSummary } from './lib/output.js'
import { buildMeta } from './lib/env.js'
import { mergeSummaries } from './lib/stats.js'

function parseList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value).split(',').map((s) => s.trim()).filter(Boolean)
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    suite: 'all',
    provider: 'nats',
    topology: 'all',
    size: 'all',
    seed: 1,
    out: 'bench-results',
    samples: undefined,
    warmup: undefined,
    samplesProvided: false,
    warmupProvided: false,
    concurrency: 1,
    timeoutMs: 30000,
    regen: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    switch (key) {
      case 'suite':
        args.suite = next
        i++
        break
      case 'provider':
        args.provider = next
        i++
        break
      case 'topology':
        args.topology = next
        i++
        break
      case 'size':
        args.size = next
        i++
        break
      case 'seed':
        args.seed = Number(next) || 1
        i++
        break
      case 'out':
        args.out = next
        i++
        break
      case 'samples':
        {
          const val = Number(next)
          if (Number.isFinite(val)) {
            args.samples = val
            args.samplesProvided = true
          }
        }
        i++
        break
      case 'warmup':
        {
          const val = Number(next)
          if (Number.isFinite(val)) {
            args.warmup = val
            args.warmupProvided = true
          }
        }
        i++
        break
      case 'concurrency':
        args.concurrency = Number(next) || args.concurrency
        i++
        break
      case 'timeoutMs':
        args.timeoutMs = Number(next) || args.timeoutMs
        i++
        break
      case 'regen':
        args.regen = true
        break
      case 'help':
      case 'h':
        args.help = true
        break
      default:
        break
    }
  }

  return {
    ...args,
    suiteList: parseList(args.suite),
    topologyList: parseList(args.topology),
    sizeList: parseList(args.size),
  }
}

function printHelp() {
  const help = `
Usage: node bench/graph/run.js [--suite micro|workload|scale|all] [--provider nats] [--topology uniform|hub|chain|all] [--size S1,S2|all] [--seed 1] [--samples 500] [--warmup 50] [--concurrency 1] [--timeoutMs 30000] [--regen] [--out ./bench-results]
`
  console.log(help.trim())
}

function summarizeBySuite(rows) {
  const acc = {}
  for (const row of rows) {
    const entry = acc[row.suite] ||= { cases: 0, samples: 0, errors: 0 }
    entry.cases += 1
    entry.samples += row.metrics?.samples ?? 0
    entry.errors += row.metrics?.errorCount ?? 0
  }
  return acc
}

async function main() {
  const opts = parseArgs()
  if (opts.help) {
    printHelp()
    return
  }

  const suiteList = opts.suiteList.includes('all')
    ? ['micro', 'workload', 'scale']
    : opts.suiteList

  const microSamples = opts.samplesProvided ? opts.samples : 500
  const workloadSamples = microSamples
  const scaleSamples = opts.samplesProvided ? opts.samples : undefined
  const microWarmup = opts.warmupProvided ? opts.warmup : 50
  const workloadWarmup = microWarmup
  const scaleWarmup = opts.warmupProvided ? opts.warmup : undefined

  const { runDir, timestamp } = createRunDirectory(opts.out)
  const benchConfig = {
    samples: {
      micro: microSamples,
      workload: workloadSamples,
      scale: scaleSamples ?? SCALE_DEFAULTS.samples,
    },
    warmup: {
      micro: microWarmup,
      workload: workloadWarmup,
      scale: scaleWarmup ?? SCALE_DEFAULTS.warmup,
    },
    concurrency: opts.concurrency,
    timeoutMs: opts.timeoutMs,
    seed: opts.seed,
    regen: opts.regen,
  }
  const meta = buildMeta({ provider: opts.provider, suites: suiteList, benchConfig })
  meta.timestamp = timestamp
  writeMeta(runDir, meta)

  const allRows = []
  const writers = {}
  const onResult = (suite) => (row) => {
    writers[suite] = appendJsonl(runDir, suite, row)
  }

  if (suiteList.includes('micro')) {
    console.log('Running micro suite...')
    const rows = await runMicroSuite({
      provider: opts.provider,
      seed: opts.seed,
      samples: microSamples,
      warmup: microWarmup,
      concurrency: opts.concurrency,
      timeoutMs: opts.timeoutMs,
      regen: opts.regen,
      onResult: onResult('micro'),
      logger: console,
    })
    allRows.push(...rows)
  }

  if (suiteList.includes('workload')) {
    console.log('Running workload suite...')
    const rows = await runWorkloadSuite({
      provider: opts.provider,
      topology: opts.topologyList[0] && opts.topologyList[0] !== 'all' ? opts.topologyList[0] : undefined,
      sizeLabel: opts.sizeList[0] && opts.sizeList[0] !== 'all' ? opts.sizeList[0] : undefined,
      seed: opts.seed,
      samples: workloadSamples,
      warmup: workloadWarmup,
      concurrency: opts.concurrency,
      timeoutMs: opts.timeoutMs,
      regen: opts.regen,
      onResult: onResult('workload'),
      logger: console,
    })
    allRows.push(...rows)
  }

  if (suiteList.includes('scale')) {
    console.log('Running scale suite...')
    const rows = await runScaleSuite({
      provider: opts.provider,
      topologies: resolveScaleTopologies(opts.topologyList),
      sizes: resolveScaleSizes(opts.sizeList),
      seed: opts.seed,
      samples: scaleSamples,
      warmup: scaleWarmup,
      concurrency: opts.concurrency,
      timeoutMs: opts.timeoutMs,
      regen: opts.regen,
      onResult: onResult('scale'),
      logger: console,
    })
    allRows.push(...rows)
  }

  const summary = {
    runDir: path.resolve(runDir),
    meta,
    suites: summarizeBySuite(allRows),
    totals: mergeSummaries(allRows),
  }
  writeSummary(runDir, summary)

  const files = Object.keys(writers).map((s) => `${s}.jsonl`)
  console.log(`Finished. Output in ${runDir}`)
  console.log(`Meta: ${path.join(runDir, 'meta.json')}`)
  if (files.length) console.log(`JSONL: ${files.join(', ')}`)
  console.log(`Summary: ${path.join(runDir, 'summary.json')}`)
}

main().catch((err) => {
  console.error('Benchmark run failed', err)
  process.exitCode = 1
})
