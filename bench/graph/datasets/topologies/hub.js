export async function buildHubTopology({
  g,
  vertexIds,
  hubVertexIds,
  edgeCount,
  rng,
  labelPool,
  onEdge,
}) {
  const totalVertices = vertexIds.length
  const hubs = hubVertexIds.length ? hubVertexIds : vertexIds.slice(0, Math.max(1, Math.floor(totalVertices * 0.01)))
  for (let i = 0; i < edgeCount; i++) {
    const useHub = rng() < 0.75
    let src, dst
    let attempts = 0
    do {
      const hub = hubs[Math.floor(rng() * hubs.length)]
      const other = vertexIds[Math.floor(rng() * totalVertices)]
      src = useHub ? hub : other
      dst = useHub ? other : hub
      attempts++
    } while (src === dst && attempts < 4)
    if (src === dst) {
      dst = vertexIds[(i + 1) % totalVertices]
    }
    const label = labelPool[Math.floor(rng() * labelPool.length)]
    const [edgeId] = await g.addE(label, src, dst)
    await onEdge({ edgeId, src, dst, label })
  }
}
