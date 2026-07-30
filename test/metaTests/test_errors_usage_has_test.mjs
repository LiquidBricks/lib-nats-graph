import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { promises as fs } from 'node:fs'

const stepsRoot = path.resolve(import.meta.dirname, '../../steps')
const testsRoot = path.resolve(import.meta.dirname, '../steps')

const IGNORE_DIRS = new Set(['optimized', 'shelved'])
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

async function collectExistingTestNames(dir) {
  const out = new Set()
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const f of await collectExistingTestNames(path.join(dir, entry.name))) {
        out.add(f)
      }
    } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
      out.add(path.basename(entry.name, '.mjs'))
    }
  }
  return out
}

test.skip('per-step: every diagnostic code used in a step has a matching assertion in its test file', async () => {
  const stepFiles = await collectStepFiles(stepsRoot)
  const existingTestNames = await collectExistingTestNames(testsRoot)

  const missingByStep = []

  for (const stepFile of stepFiles) {
    const src = await fs.readFile(stepFile, 'utf8')
    const stepName = path.basename(stepFile, '.js')

    // Extract unique codes statically imported from the central diagnostics catalog.
    const codes = new Set()
    const re = /import\s*\{([^}]+)\}\s*from\s*['"]@liquid-bricks\/lib-diagnostics\/codes['"]/g
    for (const match of src.matchAll(re)) {
      for (const imported of match[1].split(',')) {
        const code = imported.trim().split(/\s+as\s+/)[0]
        if (/^[A-Z][A-Z0-9_]*$/.test(code)) codes.add(code)
      }
    }

    if (codes.size === 0) continue

    // Ensure test file exists
    if (!existingTestNames.has(stepName)) {
      missingByStep.push(`${stepName} -> missing test file`)
      continue
    }

    const testFile = path.join(testsRoot, `${stepName}.mjs`)
    const testSrc = await fs.readFile(testFile, 'utf8').catch(() => '')
    const missingCodes = [...codes].filter(code => !new RegExp(`\\b${code}\\b`).test(testSrc))
    if (missingCodes.length > 0) {
      missingByStep.push(`${stepName} -> missing error coverage: ${missingCodes.join(', ')}`)
    }
  }

  assert.deepEqual(missingByStep, [], `Uncovered diagnostic code usages:\n${missingByStep.join('\n')}`)
})
