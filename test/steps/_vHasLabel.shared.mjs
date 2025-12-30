import assert from 'node:assert/strict'
import test, { suite, after } from 'node:test'

import { addV } from '../../steps/root/addV.js'
import { _vHasLabel } from '../../steps/optimized/_vHasLabel.js'
import { operationFactoryKey } from '../../steps/types.js'

export function runVHasLabelSuite({ label, kvProviderFactory, diagnosticsFactory }) {
  const closers = []
  const diags = diagnosticsFactory ?? (() => ({ child: () => ({}) }))

  async function setupKV() {
    const kvp = await kvProviderFactory()
    closers.push(() => kvp.close?.())
    return kvp.interface
  }
  after(async () => { for (const c of closers) await c?.() })

  suite(`_vHasLabel optimized step [${label}]`, () => {
    test('filters by label: yields ids of vertices with the given label (order-agnostic)', async () => {
      const kvStore = await setupKV()
      const created = { component: [], service: [] }
      for (const lbl of ['component', 'service', 'component', 'service']) {
        const [id] = await Array.fromAsync(addV[operationFactoryKey]({ ctx: { kvStore, diagnostics: diags() }, args: [lbl] }))
        created[lbl].push(id)
      }

      const out = await Array.fromAsync(_vHasLabel[operationFactoryKey]({ ctx: { kvStore }, args: ['component'] }))
      assert.deepEqual(new Set(out), new Set(created.component))
    })

    test('non-existent label yields empty result', async () => {
      const kvStore = await setupKV()
      for (const lbl of ['service', 'service']) {
        await Array.fromAsync(addV[operationFactoryKey]({ ctx: { kvStore, diagnostics: diags() }, args: [lbl] }))
      }
      const out = await Array.fromAsync(_vHasLabel[operationFactoryKey]({ ctx: { kvStore }, args: ['component'] }))
      assert.deepEqual(out, [])
    })
  })
}

