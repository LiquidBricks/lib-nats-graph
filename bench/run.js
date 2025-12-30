#!/usr/bin/env node
// Basic micro-benchmarks for the graph API using tinybench.
// Usage:
//   npm i -D tinybench
//   node bench/run.js
//
// Runs the suite against the available kv providers (NATS, Redis, in-memory).

import { Graph } from '../graph/graph.js'
import fs from 'node:fs'
import path from 'node:path'
import { createBench } from './steps/index.js'
import { natsProviderConfig } from './providers/nats.js'
import { memoryProviderConfig } from './providers/memory.js'
import { redisProviderConfig } from './providers/redis.js'
import { createNatsProviderBench } from './providerBenches/nats.js'
import { createMemoryProviderBench } from './providerBenches/memory.js'
import { createRedisProviderBench } from './providerBenches/redis.js'

function formatRows(bench) {
  const rows = bench.tasks.map(({ name, result: r }) => ({
    task: name,
    'ops/s': Number(r.hz.toFixed(0)),
    'avg (ms)': Number(r.mean).toFixed(1),
    '±%': Number(r.rme.toFixed(0)),
    'p99': r.p99.toFixed(1),
    samples: r.samples.length,
  }))
  return rows.sort((a, b) => a['ops/s'] < b['ops/s'] ? -1 : 1)
}

const marksRoot = path.resolve(import.meta.dirname, 'marks')
const runTimestamp = new Date().toISOString()
const safeRunTimestamp = runTimestamp.replace(/[:.]/g, '-')
const runMarksDir = path.join(marksRoot, safeRunTimestamp)
fs.mkdirSync(runMarksDir, { recursive: true })

function rebuildMarksIndex() {
  try {
    const entries = []
    const runDirs = fs.readdirSync(marksRoot, { withFileTypes: true }).filter(d => d.isDirectory())
    for (const dir of runDirs) {
      const runId = dir.name
      const dirPath = path.join(marksRoot, runId)
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        try {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          entries.push({ runId, file, ...parsed })
        } catch (err) {
          console.error(`Skipping mark file ${filePath}`, err)
        }
      }
    }
    entries.sort((a, b) => {
      const aTs = new Date(a.timestamp || a.runId).getTime()
      const bTs = new Date(b.timestamp || b.runId).getTime()
      return aTs - bTs
    })
    const indexFile = path.join(marksRoot, 'index.json')
    fs.writeFileSync(indexFile, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2) + '\n')
    return indexFile
  } catch (err) {
    console.error('Failed to rebuild benchmark marks index', err)
    return null
  }
}

function startBenchProgress(message, intervalMs = 5000) {
  const timer = setInterval(() => {
    console.log(`${message} still running…`)
  }, intervalMs)
  return () => clearInterval(timer)
}

function writeMark({ suite, provider, benchDurationMs, rows }) {
  try {
    const timestamp = new Date().toISOString()
    const safeProvider = provider.replace(/[^a-z0-9-_]/gi, '_')
    const payload = {
      suite,
      provider,
      timestamp,
      durationSeconds: benchDurationMs / 1000,
      rows,
    }
    const outFile = path.join(runMarksDir, `${suite}-${safeProvider}.json`)
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n')
    return outFile
  } catch (err) {
    console.error('Failed to write benchmark mark file', err)
    return null
  }
}

async function runGraphBenchForProvider({ provider, kvConfig }) {
  const graph = Graph({ kv: provider, kvConfig })
  const { g } = graph

  try {
    await g.drop()
    const bench = await createBench(g)
    const benchStartedAt = Date.now()
    await bench.run()
    const benchDurationMs = Date.now() - benchStartedAt
    const rows = formatRows(bench)
    const outFile = writeMark({ suite: 'graph', provider, benchDurationMs, rows })
    return { rows, benchDurationMs, outFile }
  } finally {
    await graph.close?.()
  }
}

async function runProviderBench({ provider, createBenchFn }) {
  const { bench, kvStore } = await createBenchFn()
  try {
    const benchStartedAt = Date.now()
    await bench.run()
    const benchDurationMs = Date.now() - benchStartedAt
    const rows = formatRows(bench)
    const outFile = writeMark({ suite: 'provider', provider, benchDurationMs, rows })
    return { rows, benchDurationMs, outFile }
  } finally {
    await kvStore?.close?.()
  }
}

async function main() {
  const providers = [
    { config: natsProviderConfig(), createProviderBench: createNatsProviderBench },
    { config: redisProviderConfig(), createProviderBench: createRedisProviderBench },
    { config: memoryProviderConfig(), createProviderBench: createMemoryProviderBench },
  ]
  const graphCombinedRows = []
  const kvCombinedRows = []
  const totalBenchmarks = providers.length * 2
  let benchIndex = 0

  for (const { config, createProviderBench } of providers) {
    const providerLabel = config.provider
    benchIndex += 1
    const providerMsg = `[${benchIndex}/${totalBenchmarks}] Running provider-only benchmarks for "${providerLabel}"`
    console.log(`\n${providerMsg}`)
    const stopProviderProgress = startBenchProgress(providerMsg)
    try {
      const { rows, benchDurationMs, outFile } = await runProviderBench({ provider: providerLabel, createBenchFn: createProviderBench })
      kvCombinedRows.push(...rows.map(r => ({ provider: providerLabel, ...r })))
      console.table(rows)
      console.log(`Benchmark duration: ${(benchDurationMs / 1000).toFixed(2)}s`)
      if (outFile) console.log(`Saved benchmark output to ${outFile}`)
    } catch (err) {
      console.error(`Provider benchmarks failed for "${providerLabel}"`, err)
    }
    finally {
      stopProviderProgress()
    }

    benchIndex += 1
    const graphMsg = `[${benchIndex}/${totalBenchmarks}] Running graph-step benchmarks for "${providerLabel}"`
    console.log(`\n${graphMsg}`)
    const stopGraphProgress = startBenchProgress(graphMsg)
    try {
      const { rows, benchDurationMs, outFile } = await runGraphBenchForProvider(config)
      graphCombinedRows.push(...rows.map(r => ({ provider: providerLabel, ...r })))
      console.table(rows)
      console.log(`Benchmark duration: ${(benchDurationMs / 1000).toFixed(2)}s`)
      if (outFile) console.log(`Saved benchmark output to ${outFile}`)
    } catch (err) {
      console.error(`Graph benchmarks failed for "${providerLabel}"`, err)
    }
    finally {
      stopGraphProgress()
    }
  }

  if (kvCombinedRows.length) {
    console.log('\nProvider-level results (higher ops/s is better)')
    console.table(kvCombinedRows)
  }

  if (graphCombinedRows.length) {
    console.log('\nGraph traversal results (higher ops/s is better)')
    console.table(graphCombinedRows)
  }

  const indexFile = rebuildMarksIndex()
  if (indexFile) console.log(`Updated marks index at ${indexFile}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
