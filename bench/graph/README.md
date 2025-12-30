# Graph Benchmarks (micro + workloads + scale)

This harness wraps the graph providers (NATS, Redis, or in-memory) with three suites:

- **micro**: step-level latency (reads, expands, filters, writes) using the smallest dataset (S1/uniform).
- **workload**: 10 traversal shapes that mirror common Gremlin usage on a mid-size dataset (S2/uniform by default).
- **scale**: runs the workload suite across the size/topology matrix to capture p50/p95/p99 curves.

## Quick start

```bash
node bench/graph/run.js --suite micro --provider nats
node bench/graph/run.js --suite micro --provider redis
node bench/graph/run.js --suite workload --provider nats
node bench/graph/run.js --suite scale --provider nats --topology hub --size S1,S2 --seed 1
```

Flags:

- `--suite micro|workload|scale|all`
- `--provider nats|redis|memory`
- `--topology uniform|hub|chain|all` (scale uses all by default; workload uses the first value if provided)
- `--size S1|S2|S3|S4|all`
- `--seed 123` (deterministic datasets + sampling)
- `--samples 500` (per-case sample count; scale defaults to 200 if not overridden)
- `--warmup 50`
- `--concurrency 1`
- `--timeoutMs 30000`
- `--regen` to force dataset regeneration
- `--out ./bench-results`

Redis benchmarks read `REDIS_BENCH_URL`, `REDIS_BENCH_PREFIX`, and `REDIS_BENCH_DATABASE` (defaults: `redis://127.0.0.1:6379`, prefix `nats-graph-benchmark`).

Outputs are written under `bench-results/<timestamp>/`:

- `meta.json` — environment + config snapshot
- `<suite>.jsonl` — one row per benchmark case
- `summary.json` — aggregated counts/errors

## Datasets, topologies, and manifests

- Sizes live in `bench/graph/config/sizes.json` (vertices, edges, hotsetRatio, and `scaleDefault` boolean to control which sizes run when `--size all` is used).
- Topologies live in `bench/graph/datasets/topologies/`:
  - `uniform`: even-ish random edges
  - `hub`: 75% of edges touch a small hub set
  - `chain`: linear spine plus light cross-links
- Datasets are generated deterministically (ULIDs + seeded PRNG), cached via manifests in `bench/graph/datasets/manifests/`.
- Each manifest records dataset metadata, degree stats, and deterministic sample sets:
  - `randomVertexIds` (1000), `hotVertexIds` (1000), `hubVertexIds` (100), `randomEdgeIds` (1000).
- The KV store is tagged with the active dataset id; if a manifest exists **and** the marker matches, generation is skipped unless `--regen` is set. Switching size/topology automatically rebuilds after a `g.drop()`.

## Workloads

Workload definitions and defaults live in `bench/graph/config/workloads.json`. The suite implements:

1) `point_read_vertex_valueMap`  
2) `point_read_edge_valueMap`  
3) `neighbor_expand_1hop_ids` (+ hub variant)  
4) `adjacency_edges_then_vertices`  
5) `filter_by_label_then_limit`  
6) `filter_by_prop_then_limit`  
7) `boolean_filter_combo`  
8) `tail_recent_vertices`  
9) `count_vertices_by_label`  
10) `write_add_vertex_and_property`

To add a workload: extend the config file (label/limit/prop defaults) and add a case in `bench/graph/suites/workload/workloads.js` (name, `params`, `sampleSet`, and `run` function).

## Running scale safely

- Use `--size S1,S2` or flip `scaleDefault` to `false` for heavy sizes in `config/sizes.json`.
- Lower `--samples` and `--warmup` for faster passes (the scale suite defaults to 200/25).
- Limit topologies: `--topology uniform` or `--topology uniform,hub`.

## Comparing runs

- Compare `summary.json` files directly (`diff`, `jq`) for counts/errors.
- JSONL rows include dataset ids (`<provider>-<topology>-<size>-<seed>`) and percentiles (avg, p50, p95, p99) for downstream plotting or CI diffing.

## Layout

```
bench/graph/
  run.js                 # CLI entrypoint
  config/                # sizes + workload defaults
  datasets/              # generators, manifests, topologies
  lib/                   # runner, stats, timers, env/output helpers
  suites/
    micro/               # step-level cases
    workload/            # traversal workloads
    scale/               # workload x size/topology matrix
  README.md
```
