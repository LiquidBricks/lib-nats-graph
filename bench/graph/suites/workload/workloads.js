import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workloadsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'workloads.json'), 'utf8')
)

export function workloadDefaults() {
  return {
    datasetSize: workloadsConfig.defaultDataset?.size || 'S2',
    topology: workloadsConfig.defaultDataset?.topology || 'uniform',
    samples: workloadsConfig.defaults?.samples ?? 500,
    warmup: workloadsConfig.defaults?.warmup ?? 50,
  }
}

export function buildWorkloads({ dataset }) {
  const cfg = workloadsConfig.workloads || {}
  const cases = [
    {
      name: 'point_read_vertex_valueMap',
      kind: 'workload',
      sampleSet: cfg.point_read_vertex_valueMap?.sampleSet || 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).valueMap(),
    },
    {
      name: 'point_read_edge_valueMap',
      kind: 'workload',
      sampleSet: cfg.point_read_edge_valueMap?.sampleSet || 'randomEdgeIds',
      run: async ({ g, sample }) => sample && g.E(sample).valueMap(),
    },
    {
      name: 'neighbor_expand_1hop_ids',
      kind: 'workload',
      sampleSet: cfg.neighbor_expand_1hop_ids?.sampleSet || 'randomVertexIds',
      params: { hops: 1 },
      run: async ({ g, sample }) => sample && g.V(sample).out().id(),
    },
    {
      name: 'neighbor_expand_1hop_ids (hub)',
      kind: 'workload',
      sampleSet: cfg.neighbor_expand_1hop_ids?.hubSampleSet || 'hubVertexIds',
      params: { hops: 1, sample: 'hub' },
      run: async ({ g, sample }) => sample && g.V(sample).out().id(),
    },
    {
      name: 'adjacency_edges_then_vertices',
      kind: 'workload',
      sampleSet: cfg.adjacency_edges_then_vertices?.sampleSet || 'randomVertexIds',
      run: async ({ g, sample }) => sample && g.V(sample).outE().inV().id(),
    },
    {
      name: 'filter_by_label_then_limit',
      kind: 'workload',
      params: { label: cfg.filter_by_label_then_limit?.label || 'person', limit: cfg.filter_by_label_then_limit?.limit || 25 },
      run: async ({ g }) => g.V().has('label', cfg.filter_by_label_then_limit?.label || 'person').limit(cfg.filter_by_label_then_limit?.limit || 25).id(),
    },
    {
      name: 'filter_by_prop_then_limit',
      kind: 'workload',
      params: {
        key: cfg.filter_by_prop_then_limit?.key || 'group',
        value: cfg.filter_by_prop_then_limit?.value ?? 0,
        limit: cfg.filter_by_prop_then_limit?.limit || 25,
      },
      run: async ({ g }) => g.V().has(cfg.filter_by_prop_then_limit?.key || 'group', cfg.filter_by_prop_then_limit?.value ?? 0).limit(cfg.filter_by_prop_then_limit?.limit || 25).valueMap(),
    },
    {
      name: 'boolean_filter_combo',
      kind: 'workload',
      params: { key: cfg.boolean_filter_combo?.key || 'group', value: cfg.boolean_filter_combo?.value ?? 1 },
      run: async ({ g }) => g.V().has(cfg.boolean_filter_combo?.key || 'group', cfg.boolean_filter_combo?.value ?? 1).and((__) => __.out(), (__) => __.not((___) => ___.has('hot', true))),
    },
    {
      name: 'tail_recent_vertices',
      kind: 'workload',
      params: { limit: cfg.tail_recent_vertices?.limit || 20 },
      run: async ({ g }) => g.V().tail(cfg.tail_recent_vertices?.limit || 20).valueMap(),
    },
    {
      name: 'count_vertices_by_label',
      kind: 'workload',
      params: { label: cfg.count_vertices_by_label?.label || 'person' },
      run: async ({ g }) => g.V().has('label', cfg.count_vertices_by_label?.label || 'person').count(),
    },
    {
      name: 'write_add_vertex_and_property',
      kind: 'workload',
      samples: 200,
      params: { cleanup: cfg.write_add_vertex_and_property?.cleanup ?? true },
      run: async ({ g }) => {
        const [v] = await g.addV('workload_new')
        await g.V(v).property('group', 1)
        if (cfg.write_add_vertex_and_property?.cleanup ?? true) {
          await g.V(v).drop()
        }
      },
    },
  ]

  return cases.map((c) => ({
    ...c,
    params: { ...(c.params || {}), dataset: dataset?.meta },
  }))
}
