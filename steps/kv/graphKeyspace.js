export const graphKeyspace = Object.freeze({
  vertex: Object.freeze({
    record: (id) => `node.${id}`,
    all: () => 'node.*',
    allDeep: () => 'node.>',
    descendantsPattern: (id) => `node.${id}.>`,

    label: (id) => `node.${id}.label`,
    labelMarker: (id, label) => `node.${id}.label.${label}`,
    byLabelPattern: (label) => `node.*.label.${label}`,

    property: (id, key) => `node.${id}.property.${key}`,
    propertiesPattern: (id) => `node.${id}.property.*`,
    propertyKeys: Object.freeze({
      meta: (id) => `node.${id}.props.meta`,
      chunk: (id, chunkId) => `node.${id}.props.c.${chunkId}`,
      allForVertex: (id) => `node.${id}.props.>`,
    }),

    outE: Object.freeze({
      key: (fromId, edgeId) => `node.${fromId}.outE.${edgeId}`,
      keyByLabel: (fromId, label, edgeId) => `node.${fromId}.outE.${label}.${edgeId}`,
      pattern: (fromId) => `node.${fromId}.outE.>`,
      patternByLabel: (fromId, label) => `node.${fromId}.outE.${label}.>`,
      index: (fromId) => `node.${fromId}.outE.__index`,
      indexByLabel: (fromId, label) => `node.${fromId}.outE.${label}.__index`,
      scanFallbackPattern: (fromId) => `node.${fromId}.outE.*`,
    }),

    inE: Object.freeze({
      key: (toId, edgeId) => `node.${toId}.inE.${edgeId}`,
      keyByLabel: (toId, label, edgeId) => `node.${toId}.inE.${label}.${edgeId}`,
      pattern: (toId) => `node.${toId}.inE.>`,
      patternByLabel: (toId, label) => `node.${toId}.inE.${label}.>`,
      index: (toId) => `node.${toId}.inE.__index`,
      indexByLabel: (toId, label) => `node.${toId}.inE.${label}.__index`,
      scanFallbackPattern: (toId) => `node.${toId}.inE.*`,
    }),

    outV: Object.freeze({
      key: (fromId, toId) => `node.${fromId}.outV.${toId}`,
      keyByLabel: (fromId, label, toId) => `node.${fromId}.outV.${label}.${toId}`,
      pattern: (fromId) => `node.${fromId}.outV.*`,
      patternByLabel: (fromId, label) => `node.${fromId}.outV.${label}.*`,
      index: (fromId) => `node.${fromId}.outV.__index`,
      indexByLabel: (fromId, label) => `node.${fromId}.outV.${label}.__index`,
    }),

    inV: Object.freeze({
      key: (toId, fromId) => `node.${toId}.inV.${fromId}`,
      keyByLabel: (toId, label, fromId) => `node.${toId}.inV.${label}.${fromId}`,
      pattern: (toId) => `node.${toId}.inV.*`,
      patternByLabel: (toId, label) => `node.${toId}.inV.${label}.*`,
      index: (toId) => `node.${toId}.inV.__index`,
      indexByLabel: (toId, label) => `node.${toId}.inV.${label}.__index`,
    }),
  }),

  edge: Object.freeze({
    record: (id) => `edge.${id}`,
    allDeep: () => 'edge.>',
    fieldsPattern: (id) => `edge.${id}.*`,
    descendantsPattern: (id) => `edge.${id}.>`,
    label: (id) => `edge.${id}.label`,
    incoming: (id) => `edge.${id}.incoming`,
    outgoing: (id) => `edge.${id}.outgoing`,
    property: (id, key) => `edge.${id}.property.${key}`,
    propertiesPattern: (id) => `edge.${id}.property.*`,
    propertyKeys: Object.freeze({
      meta: (id) => `edge.${id}.props.meta`,
      chunk: (id, chunkId) => `edge.${id}.props.c.${chunkId}`,
      allForEdge: (id) => `edge.${id}.props.>`,
    }),
  }),

  edgesIndex: Object.freeze({
    record: (id) => `edges.${id}`,
    all: () => 'edges.*',
    allDeep: () => 'edges.>',
  }),

  adj: Object.freeze({
    outE: Object.freeze({
      meta: (vertexId) => `adj.outE.${vertexId}.meta`,
      chunk: (vertexId, chunkId) => `adj.outE.${vertexId}.c.${chunkId}`,
      labelMeta: (vertexId, label) => `adj.outE.${vertexId}.label.${label}.meta`,
      labelChunk: (vertexId, label, chunkId) => `adj.outE.${vertexId}.label.${label}.c.${chunkId}`,
      allForVertex: (vertexId) => `adj.outE.${vertexId}.>`,
      allLabelForVertex: (vertexId, label) => `adj.outE.${vertexId}.label.${label}.>`,
    }),
    outV: Object.freeze({
      meta: (vertexId) => `adj.outV.${vertexId}.meta`,
      chunk: (vertexId, chunkId) => `adj.outV.${vertexId}.c.${chunkId}`,
      labelMeta: (vertexId, label) => `adj.outV.${vertexId}.label.${label}.meta`,
      labelChunk: (vertexId, label, chunkId) => `adj.outV.${vertexId}.label.${label}.c.${chunkId}`,
      allForVertex: (vertexId) => `adj.outV.${vertexId}.>`,
      allLabelForVertex: (vertexId, label) => `adj.outV.${vertexId}.label.${label}.>`,
    }),
    inV: Object.freeze({
      meta: (vertexId) => `adj.inV.${vertexId}.meta`,
      chunk: (vertexId, chunkId) => `adj.inV.${vertexId}.c.${chunkId}`,
      labelMeta: (vertexId, label) => `adj.inV.${vertexId}.label.${label}.meta`,
      labelChunk: (vertexId, label, chunkId) => `adj.inV.${vertexId}.label.${label}.c.${chunkId}`,
      allForVertex: (vertexId) => `adj.inV.${vertexId}.>`,
      allLabelForVertex: (vertexId, label) => `adj.inV.${vertexId}.label.${label}.>`,
    }),
    inE: Object.freeze({
      meta: (vertexId) => `adj.inE.${vertexId}.meta`,
      chunk: (vertexId, chunkId) => `adj.inE.${vertexId}.c.${chunkId}`,
      labelMeta: (vertexId, label) => `adj.inE.${vertexId}.label.${label}.meta`,
      labelChunk: (vertexId, label, chunkId) => `adj.inE.${vertexId}.label.${label}.c.${chunkId}`,
      allForVertex: (vertexId) => `adj.inE.${vertexId}.>`,
      allLabelForVertex: (vertexId, label) => `adj.inE.${vertexId}.label.${label}.>`,
    }),
    all: () => 'adj.>',
  }),
})
