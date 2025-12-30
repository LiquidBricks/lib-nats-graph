import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { promises as fs } from 'node:fs'

const stepsRoot = path.resolve(import.meta.dirname, '../../steps')
const testsRoot = path.resolve(import.meta.dirname, '../steps')

const IGNORE_DIRS = new Set(['shelved'])
const IGNORE_FILES = new Set(['types.js', 'outputTypeMappings.js'])

async function collectStepFiles(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      await collectStepFiles(path.join(dir, entry.name), out)
    } else if (entry.isFile()) {
      if (!entry.name.endsWith('.js')) continue
      if (IGNORE_FILES.has(entry.name)) continue
      if (entry.name.startsWith('_')) continue
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

async function collectTestFiles(dir) {
  const out = new Set()
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Only flat tests expected here, but recurse just in case
      for (const f of await collectTestFiles(path.join(dir, entry.name))) {
        out.add(f)
      }
    } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
      out.add(path.basename(entry.name, '.mjs'))
    }
  }
  return out
}

test.skip('every step has a corresponding unit test in test/steps', async () => {
  const stepFiles = await collectStepFiles(stepsRoot)
  const requiredTestNames = new Set(stepFiles.map(f => path.basename(f, '.js')))

  const existingTestNames = await collectTestFiles(testsRoot)

  const missing = [...requiredTestNames].filter(name => !existingTestNames.has(name))

  assert.deepEqual(missing, [], `Missing tests for steps: ${missing.join(', ')}`)
})
