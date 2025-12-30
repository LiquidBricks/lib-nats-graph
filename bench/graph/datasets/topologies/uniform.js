export async function buildUniformTopology({
  g,
  vertexIds,
  edgeCount,
  rng,
  labelPool,
  onEdge,
}) {
  const totalVertices = vertexIds.length
  for (let i = 0; i < edgeCount; i++) {
    const src = vertexIds[Math.floor(rng() * totalVertices)]
    let dst = vertexIds[Math.floor(rng() * totalVertices)]
    if (src === dst) {
      dst = vertexIds[(i + 1) % totalVertices]
    }
    const label = labelPool[Math.floor(rng() * labelPool.length)]
    const [edgeId] = await g.addE(label, src, dst)
    await onEdge({ edgeId, src, dst, label })
  }
}
