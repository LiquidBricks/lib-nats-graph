import React, { useEffect, useState, useMemo, useCallback } from 'react'
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, Handle, Position } from 'reactflow'

export default function SchemaPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 8 }}>Graph Schema</h1>
      <GraphSchema />
    </main>
  )
}

function GraphSchema() {
  const initialNodes = useMemo(() => ([
    { id: 'graph', type: 'io', position: { x: 0, y: 180 }, data: { label: 'graph', typeIn: '—', typeOut: 'Graph' } },
    { id: 'addV', type: 'io', position: { x: 200, y: 60 }, data: { label: 'addV', typeIn: 'Graph', typeOut: 'Vertex' } },
    { id: 'addE', type: 'io', position: { x: 200, y: 140 }, data: { label: 'addE', typeIn: 'Graph', typeOut: 'Edge' } },
    { id: 'V', type: 'io', position: { x: 200, y: 220 }, data: { label: 'V', typeIn: 'Graph', typeOut: 'Vertex' } },
    { id: 'E', type: 'io', position: { x: 200, y: 300 }, data: { label: 'E', typeIn: 'Graph', typeOut: 'Edge' } },
    { id: 'outV', type: 'io', position: { x: 320, y: 240 }, data: { label: 'outV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'inV', type: 'io', position: { x: 320, y: 300 }, data: { label: 'inV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'bothV', type: 'io', position: { x: 320, y: 360 }, data: { label: 'bothV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'otherV', type: 'io', position: { x: 320, y: 420 }, data: { label: 'otherV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'out', type: 'io', position: { x: 320, y: 220 }, data: { label: 'out', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'in', type: 'io', position: { x: 320, y: 180 }, data: { label: 'in', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'outE', type: 'io', position: { x: 320, y: 300 }, data: { label: 'outE', typeIn: 'Vertex', typeOut: 'Edge' } },
    { id: 'inE', type: 'io', position: { x: 320, y: 340 }, data: { label: 'inE', typeIn: 'Vertex', typeOut: 'Edge' } },
    { id: 'bothE', type: 'io', position: { x: 320, y: 380 }, data: { label: 'bothE', typeIn: 'Vertex', typeOut: 'Edge' } },
    { id: 'has', type: 'io', position: { x: 420, y: 120 }, data: { label: 'has', typeIn: 'Vertex|Edge', typeOut: 'Vertex|Edge' } },
    { id: 'property', type: 'io', position: { x: 420, y: 160 }, data: { label: 'property', typeIn: 'Vertex|Edge', typeOut: 'Vertex|Edge' } },
    { id: 'Vertex', type: 'resource', position: { x: 420, y: 220 }, data: { label: 'Vertex', kind: 'resource', resourceType: 'Vertex', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'Edge', type: 'resource', position: { x: 420, y: 260 }, data: { label: 'Edge', kind: 'resource', resourceType: 'Edge', typeIn: 'Edge', typeOut: 'Edge' } },
    { id: 'valueMap', type: 'terminal', position: { x: 600, y: 60 }, data: { label: 'valueMap', typeIn: 'Vertex|Edge', typeOut: 'Map' } },
    { id: 'properties', type: 'terminal', position: { x: 600, y: 120 }, data: { label: 'properties', typeIn: 'Vertex|Edge', typeOut: 'Value' } },
    { id: 'id', type: 'terminal', position: { x: 600, y: 180 }, data: { label: 'id', typeIn: 'Vertex|Edge', typeOut: 'String' } },
    { id: 'label', type: 'terminal', position: { x: 600, y: 240 }, data: { label: 'label', typeIn: 'Vertex|Edge', typeOut: 'String' } },
    { id: 'drop', type: 'terminal', position: { x: 600, y: 300 }, data: { label: 'drop', typeIn: 'Vertex|Edge', typeOut: '—' } },
  ]), []);

  const initialEdges = useMemo(() => ([
    { id: 'graph-addV', source: 'graph', target: 'addV' },
    { id: 'graph-addE', source: 'graph', target: 'addE' },
    { id: 'graph-V', source: 'graph', target: 'V' },
    { id: 'graph-E', source: 'graph', target: 'E' },
    { id: 'graph-drop', source: 'graph', target: 'drop' },
    { id: 'V-has', source: 'V', target: 'has' },
    { id: 'E-has', source: 'E', target: 'has' },
    { id: 'V-property', source: 'V', target: 'property' },
    { id: 'E-property', source: 'E', target: 'property' },
    { id: 'E-outV', source: 'E', target: 'outV' },
    { id: 'E-inV', source: 'E', target: 'inV' },
    { id: 'E-bothV', source: 'E', target: 'bothV' },
    { id: 'E-otherV', source: 'E', target: 'otherV' },
    { id: 'V-out', source: 'V', target: 'out' },
    { id: 'V-in', source: 'V', target: 'in' },
    { id: 'V-outE', source: 'V', target: 'outE' },
    { id: 'V-inE', source: 'V', target: 'inE' },
    { id: 'V-bothE', source: 'V', target: 'bothE' },
    { id: 'V-Vertex', source: 'V', target: 'Vertex' },
    { id: 'addV-Vertex', source: 'addV', target: 'Vertex' },
    { id: 'E-Edge', source: 'E', target: 'Edge' },
    { id: 'outV-Vertex', source: 'outV', target: 'Vertex' },
    { id: 'inV-Vertex', source: 'inV', target: 'Vertex' },
    { id: 'bothV-Vertex', source: 'bothV', target: 'Vertex' },
    { id: 'otherV-Vertex', source: 'otherV', target: 'Vertex' },
    { id: 'out-Vertex', source: 'out', target: 'Vertex' },
    { id: 'in-Vertex', source: 'in', target: 'Vertex' },
    { id: 'outE-Edge', source: 'outE', target: 'Edge' },
    { id: 'inE-Edge', source: 'inE', target: 'Edge' },
    { id: 'bothE-Edge', source: 'bothE', target: 'Edge' },
    { id: 'addE-Edge', source: 'addE', target: 'Edge' },
    { id: 'has-V', source: 'has', target: 'V' },
    { id: 'has-E', source: 'has', target: 'E' },
    { id: 'property-V', source: 'property', target: 'V' },
    { id: 'property-E', source: 'property', target: 'E' },
    { id: 'Vertex-id', source: 'Vertex', target: 'id' },
    { id: 'Vertex-label', source: 'Vertex', target: 'label' },
    { id: 'Vertex-properties', source: 'Vertex', target: 'properties' },
    { id: 'Vertex-drop', source: 'Vertex', target: 'drop' },
    { id: 'Vertex-valueMap', source: 'Vertex', target: 'valueMap' },
    { id: 'Edge-id', source: 'Edge', target: 'id' },
    { id: 'Edge-label', source: 'Edge', target: 'label' },
    { id: 'Edge-properties', source: 'Edge', target: 'properties' },
    { id: 'Edge-drop', source: 'Edge', target: 'drop' },
    { id: 'Edge-valueMap', source: 'Edge', target: 'valueMap' },
  ]), []);

  const EDGE_BLOCKLIST = useMemo(() => new Set([
    'addV-V', 'addE-E', 'id-terminal', 'label-terminal', 'E-resource',
    'V-id', 'V-label', 'V-drop', 'E-id', 'E-label', 'E-drop',
    'addV-property', 'addV-id', 'addV-label', 'addV-drop',
    'addE-property', 'addE-id', 'addE-label', 'addE-drop',
  ]), []);

  const TYPE_MAP = {
    graph: { in: '—', out: 'Graph' },
    addV: { in: 'Graph', out: 'Vertex' },
    addE: { in: 'Graph', out: 'Edge' },
    V: { in: 'Graph', out: 'Vertex' },
    E: { in: 'Graph', out: 'Edge' },
    has: { in: 'Vertex|Edge', out: 'Vertex|Edge' },
    outV: { in: 'Edge', out: 'Vertex' },
    inV: { in: 'Edge', out: 'Vertex' },
    bothV: { in: 'Edge', out: 'Vertex' },
    otherV: { in: 'Edge', out: 'Vertex' },
    out: { in: 'Vertex', out: 'Vertex' },
    in: { in: 'Vertex', out: 'Vertex' },
    outE: { in: 'Vertex', out: 'Edge' },
    inE: { in: 'Vertex', out: 'Edge' },
    bothE: { in: 'Vertex', out: 'Edge' },
    property: { in: 'Vertex|Edge', out: 'Vertex|Edge' },
    valueMap: { in: 'Vertex|Edge', out: 'Map' },
    'resource:Vertex': { in: 'Vertex', out: 'Vertex' },
    'resource:Edge': { in: 'Edge', out: 'Edge' },
    id: { in: 'Vertex|Edge', out: 'String' },
    label: { in: 'Vertex|Edge', out: 'String' },
    drop: { in: 'Graph|Vertex|Edge', out: '—' },
  };

  const mergeById = (a = [], b = []) => {
    const byId = new Map();
    for (const item of a) byId.set(item.id, item);
    for (const initial of b) {
      if (!byId.has(initial.id)) byId.set(initial.id, initial);
      else {
        const saved = byId.get(initial.id);
        byId.set(initial.id, { ...initial, ...saved, data: { ...(saved.data || {}), ...(initial.data || {}) } });
      }
    }
    return Array.from(byId.values());
  };

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [defaultViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [serverViewport, setServerViewport] = useState(null);
  const [currentViewport, setCurrentViewport] = useState(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onMoveEnd = useCallback((evt, viewport) => setCurrentViewport(viewport), []);

  // Load from server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json().catch(() => ({}));
        const layout = json?.data?.layout;
        if (layout) {
          const serverNodes = Array.isArray(layout.nodes) ? layout.nodes : [];
          const serverEdges = Array.isArray(layout.edges) ? layout.edges : [];
          const serverVp = layout.viewport && typeof layout.viewport === 'object' ? layout.viewport : null;
          if (serverNodes.length) setNodes(mergeById(serverNodes, initialNodes));
          if (serverEdges.length) setEdges(mergeById(serverEdges.filter(e => !EDGE_BLOCKLIST.has(e.id)), initialEdges));
          if (serverVp) setServerViewport(serverVp);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive highlighted nodes/edges based on hover
  const connectedIds = useMemo(() => {
    if (!hoveredNodeId) return new Set();
    const set = new Set([hoveredNodeId]);
    for (const e of edges) {
      if (e.source === hoveredNodeId) set.add(e.target);
      if (e.target === hoveredNodeId) set.add(e.source);
    }
    return set;
  }, [hoveredNodeId, edges]);

  const displayNodes = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: { ...n.data, highlighted: hoveredNodeId ? connectedIds.has(n.id) : false }
    }));
  }, [nodes, hoveredNodeId, connectedIds]);

  const displayEdges = useMemo(() => {
    return edges.map(e => {
      let stroke = '#cbd5e1';
      let strokeWidth = 1;
      let opacity = 0.5;
      if (hoveredNodeId) {
        if (e.target === hoveredNodeId) {
          // Input edge into the hovered node: blue
          stroke = '#2563eb';
          strokeWidth = 2;
          opacity = 1;
        } else if (e.source === hoveredNodeId) {
          // Output edge from the hovered node: green
          stroke = '#10b981';
          strokeWidth = 2;
          opacity = 1;
        }
      }
      return {
        ...e,
        style: {
          ...(e.style || {}),
          stroke,
          strokeWidth,
          opacity,
          transition: 'all 120ms ease-in-out',
        }
      }
    });
  }, [edges, hoveredNodeId]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0' }}>
        <div style={{ fontWeight: 600, color: '#374151' }}>Layout</div>
        <div>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/dashboard', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ data: { layout: { nodes, edges, viewport: (currentViewport || (rfInstance?.getViewport ? rfInstance.getViewport() : (rfInstance?.toObject?.().viewport)) || serverViewport || defaultViewport) } } })
                });
                await res.json().catch(() => ({}));
              } catch {}
            }}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          >Save Layout</button>
        </div>
      </div>
      <div style={{ height: '70vh', border: '1px solid #ddd', borderRadius: 8 }}>
        <ReactFlow
          onInit={(inst) => {
            setRfInstance(inst);
            try {
              const vp = inst?.getViewport ? inst.getViewport() : (inst?.toObject?.().viewport);
              if (vp) setCurrentViewport(vp);
            } catch {}
          }}
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onMoveEnd={onMoveEnd}
          onNodeMouseEnter={(_, n) => setHoveredNodeId(n.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          nodeTypes={{ io: IONode, terminal: TerminalNode, resource: ResourceNode }}
          defaultViewport={serverViewport || defaultViewport}
          fitView={!serverViewport}
        >
          <Background size={1} color="#eee" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  )
}

const TYPE_MAP = {
  graph: { in: '—', out: 'Graph' },
  addV: { in: 'Graph', out: 'Vertex' },
  addE: { in: 'Graph', out: 'Edge' },
  V: { in: 'Graph', out: 'Vertex' },
  E: { in: 'Graph', out: 'Edge' },
  outE: { in: 'Vertex', out: 'Edge' },
  property: { in: 'Vertex|Edge', out: 'Vertex|Edge' },
  valueMap: { in: 'Vertex|Edge', out: 'Map' },
  'resource:Vertex': { in: 'Vertex', out: 'Vertex' },
  'resource:Edge': { in: 'Edge', out: 'Edge' },
  id: { in: 'Vertex|Edge', out: 'String' },
  label: { in: 'Vertex|Edge', out: 'String' },
  drop: { in: 'Graph|Vertex|Edge', out: '—' },
};

function IONode({ data }) {
  const typeKey = data.kind === 'resource' && data.resourceType ? `resource:${data.resourceType}` : (data.kind || data.label);
  const typeIn = data.typeIn ?? TYPE_MAP[typeKey]?.in ?? '—';
  const typeOut = data.typeOut ?? TYPE_MAP[typeKey]?.out ?? '—';
  return (
    <div style={{
      padding: '6px 10px 18px',
      background: data.highlighted ? '#eff6ff' : '#fff',
      border: '2px solid',
      borderColor: data.highlighted ? '#2563eb' : '#ccc',
      borderRadius: 6,
      position: 'relative',
      minWidth: 140,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{data.label}</div>
      </div>
      {/* trashcan removed */}
      <span style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>in: {typeIn}</span>
      <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>out: {typeOut}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function TerminalNode({ data }) {
  const typeKey = data.kind === 'resource' && data.resourceType ? `resource:${data.resourceType}` : (data.kind || data.label);
  const map = TYPE_MAP[typeKey] || { in: '—', out: '—' };
  const typeIn = data.typeIn ?? map.in;
  const typeOut = data.typeOut ?? map.out;
  return (
    <div style={{
      padding: '6px 12px 18px',
      background: data.highlighted ? '#eef2ff' : '#f9fafb',
      color: '#111827',
      border: '1px solid',
      borderColor: data.highlighted ? '#93c5fd' : '#e5e7eb',
      borderRadius: 14,
      position: 'relative',
      minWidth: 160,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>{data.label}</div>
      </div>
      {/* trashcan removed */}
      <span style={{ position: 'absolute', left: 8, bottom: 4, fontSize: 10, color: '#6b7280' }}>in: {typeIn}</span>
      <span style={{ position: 'absolute', right: 8, bottom: 4, fontSize: 10, color: '#6b7280' }}>out: {typeOut}</span>
    </div>
  )
}

function ResourceNode({ data }) {
  const typeKey = data.kind === 'resource' && data.resourceType ? `resource:${data.resourceType}` : (data.kind || 'resource');
  const typeIn = data.typeIn ?? TYPE_MAP[typeKey]?.in ?? '—';
  const typeOut = data.typeOut ?? TYPE_MAP[typeKey]?.out ?? '—';
  return (
    <div style={{
      padding: '6px 10px 18px',
      background: data.highlighted ? '#f5f3ff' : '#f8fafc',
      color: '#111827',
      border: '1px solid',
      borderColor: data.highlighted ? '#c4b5fd' : '#e5e7eb',
      borderRadius: 10,
      position: 'relative',
      minWidth: 140,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{data.label}</div>
      </div>
      {/* trashcan removed */}
      <span style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>in: {typeIn}</span>
      <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>out: {typeOut}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
