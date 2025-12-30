function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createPrng(seed) {
  const normalized = Number(seed) || 1
  return mulberry32(normalized)
}

export function pickMany(source = [], count, rng) {
  if (!Array.isArray(source) || source.length === 0 || !count) return []
  const pick = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * source.length)
    pick.push(source[idx % source.length])
  }
  return pick
}

export function buildSampleSets({
  vertices = [],
  edges = [],
  hotVertices = [],
  hubVertices = [],
  seed = 1,
  counts = {
    randomVertices: 1000,
    hotVertices: 1000,
    hubVertices: 100,
    randomEdges: 1000,
  }
}) {
  const rng = createPrng(seed)
  return {
    randomVertexIds: pickMany(vertices, counts.randomVertices, rng),
    hotVertexIds: pickMany(hotVertices.length ? hotVertices : vertices, counts.hotVertices, rng),
    hubVertexIds: pickMany(hubVertices.length ? hubVertices : vertices, counts.hubVertices, rng),
    randomEdgeIds: pickMany(edges, counts.randomEdges, rng),
  }
}
