import fs from 'node:fs'
import path from 'node:path'

export function createRunDirectory(outRoot) {
  const timestamp = new Date().toISOString()
  const safe = timestamp.replace(/[:.]/g, '-')
  const root = path.resolve(outRoot || path.join('bench-results'))
  const runDir = path.join(root, safe)
  fs.mkdirSync(runDir, { recursive: true })
  return { runDir, timestamp }
}

export function writeMeta(runDir, meta) {
  const file = path.join(runDir, 'meta.json')
  fs.writeFileSync(file, JSON.stringify(meta, null, 2) + '\n')
  return file
}

export function appendJsonl(runDir, suite, row) {
  const file = path.join(runDir, `${suite}.jsonl`)
  fs.appendFileSync(file, JSON.stringify(row) + '\n')
  return file
}

export function writeSummary(runDir, summary) {
  const file = path.join(runDir, 'summary.json')
  fs.writeFileSync(file, JSON.stringify(summary, null, 2) + '\n')
  return file
}
