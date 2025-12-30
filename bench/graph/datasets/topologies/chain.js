export async function buildChainTopology({
  g,
  vertexIds,
  edgeCount,
  rng,
  labelPool,
  onEdge,
}) {
  const totalVertices = vertexIds.length
  const chainEdges = Math.min(edgeCount, Math.max(0, totalVertices - 1))
  for (let i = 0; i < chainEdges; i++) {
    const src = vertexIds[i]
    const dst = vertexIds[i + 1]
    const label = labelPool[i % labelPool.length]
    const [edgeId] = await g.addE(label, src, dst)
    await onEdge({ edgeId, src, dst, label })
  }

  // Fill remaining edges with sparse cross-links to keep degree variance low
  for (let i = chainEdges; i < edgeCount; i++) {
    const offset = Math.floor(rng() * totalVertices)
    let srcIdx = (offset + i) % totalVertices
    let dstIdx = (srcIdx + 1 + Math.floor(rng() * 5)) % totalVertices
    if (srcIdx === dstIdx) {
      dstIdx = (dstIdx + 1) % totalVertices
    }
    const src = vertexIds[srcIdx]
    const dst = vertexIds[dstIdx]
    const label = labelPool[Math.floor(rng() * labelPool.length)]
    const [edgeId] = await g.addE(label, src, dst)
    await onEdge({ edgeId, src, dst, label })
  }
}
