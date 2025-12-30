import React, { useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import Head from 'next/head'
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, Handle, Position } from 'reactflow'

export default function IndexPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <Head>
        <title>Graph Dashboard (Next.js)</title>
      </Head>
      <GraphFlow />
    </main>
  )
}

function GraphFlow() {
  const initialNodes = useMemo(() => ([
    { id: 'graph', type: 'io', position: { x: 0, y: 180 }, data: { label: 'graph', typeIn: '—', typeOut: 'Graph' } },

    { id: 'addV', type: 'io', position: { x: 200, y: 60 }, data: { label: 'addV', typeIn: 'Graph', typeOut: 'Vertex' } },
    { id: 'addE', type: 'io', position: { x: 200, y: 140 }, data: { label: 'addE', typeIn: 'Graph', typeOut: 'Edge' } },
    { id: 'V', type: 'io', position: { x: 200, y: 220 }, data: { label: 'V', typeIn: 'Graph', typeOut: 'Vertex' } },
    { id: 'E', type: 'io', position: { x: 200, y: 300 }, data: { label: 'E', typeIn: 'Graph', typeOut: 'Edge' } },
    { id: 'outV', type: 'io', position: { x: 320, y: 260 }, data: { label: 'outV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'inV', type: 'io', position: { x: 320, y: 280 }, data: { label: 'inV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'bothV', type: 'io', position: { x: 320, y: 300 }, data: { label: 'bothV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'otherV', type: 'io', position: { x: 320, y: 320 }, data: { label: 'otherV', typeIn: 'Edge', typeOut: 'Vertex' } },
    { id: 'out', type: 'io', position: { x: 320, y: 220 }, data: { label: 'out', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'in', type: 'io', position: { x: 320, y: 180 }, data: { label: 'in', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'outE', type: 'io', position: { x: 320, y: 300 }, data: { label: 'outE', typeIn: 'Vertex', typeOut: 'Edge' } },
    { id: 'inE', type: 'io', position: { x: 320, y: 340 }, data: { label: 'inE', typeIn: 'Vertex', typeOut: 'Edge' } },
    { id: 'bothE', type: 'io', position: { x: 320, y: 360 }, data: { label: 'bothE', typeIn: 'Vertex', typeOut: 'Edge' } },

    { id: 'has', type: 'io', position: { x: 420, y: 120 }, data: { label: 'has', typeIn: 'Vertex|Edge', typeOut: 'Vertex|Edge' } },
    { id: 'property', type: 'io', position: { x: 420, y: 160 }, data: { label: 'property', typeIn: 'Vertex|Edge', typeOut: 'Vertex|Edge' } },
    { id: 'properties', type: 'terminal', position: { x: 600, y: 120 }, data: { label: 'properties', typeIn: 'Vertex|Edge', typeOut: 'Value' } },
    { id: 'resource', type: 'resource', position: { x: 420, y: 220 }, data: { label: 'Vertex', kind: 'resource', resourceType: 'Vertex', typeIn: 'Vertex', typeOut: 'Vertex' } },
    { id: 'resourceEdge', type: 'resource', position: { x: 420, y: 260 }, data: { label: 'Edge', kind: 'resource', resourceType: 'Edge', typeIn: 'Edge', typeOut: 'Edge' } },
    { id: 'valueMap', type: 'terminal', position: { x: 600, y: 60 }, data: { label: 'valueMap', typeIn: 'Vertex|Edge', typeOut: 'Map' } },
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
    // Direct edges from resources to property
    { id: 'V-has', source: 'V', target: 'has' },
    { id: 'E-has', source: 'E', target: 'has' },
    { id: 'V-property', source: 'V', target: 'property' },
    { id: 'E-property', source: 'E', target: 'property' },
    // V outputs should route via resource, not directly to terminals
    { id: 'V-resource', source: 'V', target: 'resource' },
    { id: 'V-out', source: 'V', target: 'out' },
    { id: 'V-in', source: 'V', target: 'in' },
    { id: 'V-outE', source: 'V', target: 'outE' },
    { id: 'V-inE', source: 'V', target: 'inE' },
    { id: 'V-bothE', source: 'V', target: 'bothE' },
    { id: 'addV-resource', source: 'addV', target: 'resource' },
    { id: 'E-resourceEdge', source: 'E', target: 'resourceEdge' },
    { id: 'E-outV', source: 'E', target: 'outV' },
    { id: 'E-inV', source: 'E', target: 'inV' },
    { id: 'E-bothV', source: 'E', target: 'bothV' },
    { id: 'E-otherV', source: 'E', target: 'otherV' },
    { id: 'addE-resourceEdge', source: 'addE', target: 'resourceEdge' },
    { id: 'out-resource', source: 'out', target: 'resource' },
    { id: 'in-resource', source: 'in', target: 'resource' },
    { id: 'outE-resourceEdge', source: 'outE', target: 'resourceEdge' },
    { id: 'inE-resourceEdge', source: 'inE', target: 'resourceEdge' },
    { id: 'bothE-resourceEdge', source: 'bothE', target: 'resourceEdge' },
    // addV outputs should route via resource, not directly to terminals
    { id: 'has-V', source: 'has', target: 'V' },
    { id: 'has-E', source: 'has', target: 'E' },
    { id: 'property-V', source: 'property', target: 'V' },
    { id: 'property-E', source: 'property', target: 'E' },
    // E outputs removed; Edge is not a Vertex
    // Drop is terminal; route via resource
    { id: 'resource-id', source: 'resource', target: 'id' },
    { id: 'resource-label', source: 'resource', target: 'label' },
    { id: 'resource-properties', source: 'resource', target: 'properties' },
    { id: 'resource-drop', source: 'resource', target: 'drop' },
    { id: 'resource-valueMap', source: 'resource', target: 'valueMap' },
    { id: 'resourceEdge-id', source: 'resourceEdge', target: 'id' },
    { id: 'resourceEdge-label', source: 'resourceEdge', target: 'label' },
    { id: 'resourceEdge-properties', source: 'resourceEdge', target: 'properties' },
    { id: 'resourceEdge-drop', source: 'resourceEdge', target: 'drop' },
    { id: 'resourceEdge-valueMap', source: 'resourceEdge', target: 'valueMap' },
    { id: 'outV-resource', source: 'outV', target: 'resource' },
    { id: 'inV-resource', source: 'inV', target: 'resource' },
    { id: 'bothV-resource', source: 'bothV', target: 'resource' },
    { id: 'otherV-resource', source: 'otherV', target: 'resource' },
  ]), []);

  // Never show these edges (legacy direct outputs to terminals)
  const EDGE_BLOCKLIST = useMemo(() => new Set([
    'addV-V', 'addE-E', 'id-terminal', 'label-terminal', 'E-resource',
    // V direct outputs (allow V-property)
    'V-id', 'V-label', 'V-drop',
    // E direct outputs (allow E-property)
    'E-id', 'E-label', 'E-drop',
    // addV direct outputs
    'addV-property', 'addV-id', 'addV-label', 'addV-drop',
    // addE direct outputs
    'addE-property', 'addE-id', 'addE-label', 'addE-drop',
  ]), []);

  const LS_NODES = 'graphflow:nodes';
  const LS_EDGES = 'graphflow:edges';
  const LS_VIEWPORT = 'graphflow:viewport';

  const mergeById = (a = [], b = []) => {
    // a: saved (preferred for position/size/type), b: initial (preferred for new data/labels)
    const byId = new Map();
    for (const item of a) byId.set(item.id, item);
    for (const initial of b) {
      if (!byId.has(initial.id)) {
        byId.set(initial.id, initial);
      } else {
        const saved = byId.get(initial.id);
        byId.set(initial.id, {
          // ensure saved top-level (position, width/height, type) wins
          ...initial,
          ...saved,
          // but let initial data (labels/annotations) win inside data
          data: { ...(saved.data || {}), ...(initial.data || {}) },
        });
      }
    }
    return Array.from(byId.values());
  };

  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_NODES);
      if (saved) {
        const parsed = JSON.parse(saved).filter(n => n?.id !== 'terminal');
        return mergeById(parsed, initialNodes);
      }
    } catch { }
    return initialNodes;
  });
  const [edges, setEdges] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_EDGES);
      if (saved) {
        const parsed = JSON.parse(saved).filter(e => !EDGE_BLOCKLIST.has(e.id));
        return mergeById(parsed, initialEdges);
      }
    } catch { }
    return initialEdges;
  });
  const [defaultViewport] = useState(() => {
    try { const saved = localStorage.getItem(LS_VIEWPORT); if (saved) return JSON.parse(saved); } catch { }
    return { x: 0, y: 0, zoom: 1 };
  });
  const [serverViewport, setServerViewport] = useState(null);
  const [currentViewport, setCurrentViewport] = useState(null);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onMoveEnd = useCallback((evt, viewport) => {
    setCurrentViewport(viewport);
    try { localStorage.setItem(LS_VIEWPORT, JSON.stringify(viewport)); } catch { }
  }, []);

  useEffect(() => { try { localStorage.setItem(LS_NODES, JSON.stringify(nodes)); } catch { } }, [nodes]);
  useEffect(() => { try { localStorage.setItem(LS_EDGES, JSON.stringify(edges)); } catch { } }, [edges]);

  // Load layout from server state on mount
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
      } catch { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load layout from server state on mount
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
      } catch { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultCode = `return graph().V().id()`;
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState([]);
  const [highlightIds, setHighlightIds] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  // Graph section (vertices view)
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const onGraphNodesChange = useCallback(
    (changes) => setGraphNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onGraphEdgesChange = useCallback(
    (changes) => setGraphEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const [hoveredGraphNodeId, setHoveredGraphNodeId] = useState(null);
  const saveGraph = useCallback(async () => {
    try {
      await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: { homeGraph: { nodes: graphNodes, edges: graphEdges } } })
      }).then(r => r.json()).catch(() => ({}));
    } catch { /* ignore */ }
  }, [graphNodes, graphEdges]);
  const clearGraph = useCallback(() => {
    // Persist cleared state and update UI
    try { localStorage.setItem(LS_GRAPH_NODES, JSON.stringify([])) } catch { }
    try { localStorage.setItem(LS_GRAPH_EDGES, JSON.stringify([])) } catch { }
    setGraphNodes([]);
    setGraphEdges([]);
    // Also persist cleared state to server
    (async () => {
      try {
        await fetch('/api/dashboard', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ data: { homeGraph: { nodes: [], edges: [] } } })
        }).then(r => r.json()).catch(() => ({}));
      } catch { /* ignore */ }
    })();
  }, []);
  const removeGraphNode = useCallback((nodeId) => {
    setGraphNodes(prev => prev.filter(n => n.id !== nodeId));
    setGraphEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, []);
  const LS_GRAPH_NODES = 'graphflow:home:nodes';
  const LS_GRAPH_EDGES = 'graphflow:home:edges';

  // Derive operation type (query vs mutation) from current code
  const opType = useMemo(() => computeOpType(code), [code]);

  // Live-highlight nodes as the command changes
  useEffect(() => {
    setHighlightIds(computeHighlights(code));
  }, [code]);

  const runCommand = useCallback(async (codeOverride) => {
    const codeText = typeof codeOverride === 'string' ? codeOverride : code;
    setHighlightIds(computeHighlights(codeText));
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: codeText })
      });
      const json = await res.json().catch(() => ({}));
      const out = stringify(json.result ?? json ?? {});
      setOutput(out);
      let nextHistory;
      setHistory(h => {
        const next = [{ code: codeText, output: out, ts: Date.now() }, ...h.filter(item => item.code !== codeText)];
        nextHistory = next;
        return next;
      });
      // Persist history to backend
      try {
        await fetch('/api/dashboard', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ data: { history: nextHistory } })
        }).then(r => r.json()).catch(() => ({}));
      } catch { /* ignore */ }
    } catch (e) {
      setOutput(String(e?.message || e));
    }
  }, [code]);

  // Compute a styled node list with highlights applied
  const TERMINAL_NODES = useMemo(() => new Set(['id', 'label', 'drop', 'properties', 'valueMap']), []);
  const ALWAYS_MUTATION = useMemo(() => new Set(['addV', 'addE', 'property', 'drop']), []);
  const displayNodes = useMemo(() => {
    const hi = new Set(highlightIds);
    const nodeOps = computeNodeOps(code);
    const propsInfo = computePropertiesInfo(code);
    return nodes.map(n => {
      const highlighted = hi.has(n.id);
      const op = ALWAYS_MUTATION.has(n.id) ? 'mutation' : (nodeOps[n.id] ?? opType); // force mutation badge for addV/addE/property
      const type = TERMINAL_NODES.has(n.id) ? 'terminal' : n.type;
      const extra = n.id === 'properties' ? { details: propsInfo } : {};
      return { ...n, type, data: { ...n.data, highlighted, op, ...extra } };
    });
  }, [nodes, highlightIds, code, opType]);

  // Highlight edges connected to the hovered node
  const displayEdges = useMemo(() => {
    const hi = new Set(highlightIds);
    return edges.map(e => {
      // Edge shape rules
      const isVEtoProperty = ((e.source === 'V' || e.source === 'E') && e.target === 'property');
      const isPropertyToVE = (e.source === 'property' && (e.target === 'V' || e.target === 'E'));
      const hoverActive = hoveredNodeId && (e.source === hoveredNodeId || e.target === hoveredNodeId);
      const codeActive = hi.has(e.source) && hi.has(e.target);

      // Base visual params
      let stroke = '#cbd5e1'; // inactive
      let width = 1;
      let opacity = 0.4;
      let filter;

      if (codeActive && !hoverActive) {
        stroke = '#2563eb'; // blue-600
        width = 2; opacity = 1;
      } else if (hoverActive && !codeActive) {
        stroke = '#10b981'; // emerald-500
        width = 2; opacity = 1;
      } else if (hoverActive && codeActive) {
        // Show both colors: blue stroke with emerald glow
        stroke = '#2563eb';
        width = 2; opacity = 1;
        filter = 'drop-shadow(0 0 2px rgba(16,185,129,0.9))'; // emerald glow
      }

      return {
        ...e,
        ...(isVEtoProperty ? { type: 'bezier' } : {}),
        ...(isPropertyToVE ? { type: 'smoothstep' } : {}),
        style: {
          ...(e.style || {}),
          stroke,
          strokeWidth: width,
          opacity,
          filter,
          transition: 'all 120ms ease-in-out',
        },
      };
    });
  }, [edges, hoveredNodeId, highlightIds]);

  // Compute a pleasant radial position for new nodes
  const computePos = useCallback((k) => {
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const spacing = 100; // pixel spacing between nodes
    const r = spacing * Math.sqrt(k + 1);
    const theta = (k + 1) * GOLDEN_ANGLE;
    const cx = 500; // center X of canvas
    const cy = 160; // center Y of canvas
    return { x: Math.round(cx + r * Math.cos(theta)), y: Math.round(cy + r * Math.sin(theta)) };
  }, []);

  // Load saved Graph section layout from localStorage
  useEffect(() => {
    try {
      const savedNodes = JSON.parse(localStorage.getItem(LS_GRAPH_NODES) || '[]');
      if (Array.isArray(savedNodes)) setGraphNodes(savedNodes);
    } catch { /* ignore */ }
    try {
      const savedEdges = JSON.parse(localStorage.getItem(LS_GRAPH_EDGES) || '[]');
      if (Array.isArray(savedEdges)) setGraphEdges(savedEdges);
    } catch { /* ignore */ }
  }, []);

  // Load saved Graph section layout from server if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json().catch(() => ({}));
        const savedHistory = json?.data?.history;
        if (Array.isArray(savedHistory)) setHistory(savedHistory);
        const homeGraph = json?.data?.homeGraph;
        if (homeGraph && typeof homeGraph === 'object') {
          if (Array.isArray(homeGraph.nodes)) setGraphNodes(homeGraph.nodes);
          if (Array.isArray(homeGraph.edges)) setGraphEdges(homeGraph.edges);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Persist Graph section layout locally
  useEffect(() => {
    try { localStorage.setItem(LS_GRAPH_NODES, JSON.stringify(graphNodes)); } catch { }
  }, [graphNodes]);
  useEffect(() => {
    try { localStorage.setItem(LS_GRAPH_EDGES, JSON.stringify(graphEdges)); } catch { }
  }, [graphEdges]);

  // Derive and show Vertex↔Edge links automatically based on Edge endpoints
  useEffect(() => {
    (async () => {
      try {
        const edgeNodes = graphNodes.filter(n => String(n.id).startsWith('e:'));
        if (edgeNodes.length === 0) { setGraphEdges([]); return; }
        const vertexIds = new Set(graphNodes.filter(n => String(n.id).startsWith('v:')).map(n => String(n.id).slice(2)));
        if (vertexIds.size === 0) { setGraphEdges([]); return; }
        const ids = edgeNodes.map(n => JSON.stringify(String(n.id).slice(2))).join(',');
        const codeText = `const ids=[${ids}]; const out=[]; for (const id of ids){ const from=await graph().E(id).from(); const to=await graph().E(id).to(); out.push({id, from, to}); } return out`;
        const res = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: codeText }) });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.result) ? json.result : [];
        const nextEdges = [];
        for (const r of rows) {
          const eid = String(r?.id ?? '');
          const from = r?.from != null ? String(r.from) : null;
          const to = r?.to != null ? String(r.to) : null;
          if (from && vertexIds.has(from)) {
            nextEdges.push({ id: `v:${from}__to__e:${eid}`, source: `v:${from}`, target: `e:${eid}` });
          }
          if (to && vertexIds.has(to)) {
            nextEdges.push({ id: `e:${eid}__to__v:${to}`, source: `e:${eid}`, target: `v:${to}` });
          }
        }
        setGraphEdges(nextEdges);
      } catch { /* ignore */ }
    })();
  }, [graphNodes]);

  function stringify(v) {
    try { return typeof v === 'string' ? v : JSON.stringify(v, null, 2) } catch { return String(v) }
  }

  // Add nodes from a history item's output to the Graph section
  const addFromHistory = useCallback(async (histItem) => {
    // Parse history output as JSON
    let data;
    try { data = JSON.parse(histItem.output); } catch { data = null; }
    if (!data) return;

    // Normalize to array of { id, label? }
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (typeof data === 'object' && data) {
      // If object with an `items` key or single vertex-like
      if (Array.isArray(data.items)) items = data.items;
      else if ('id' in data) items = [data];
    }
    // Map to a set of ids
    const wanted = [];
    // Heuristic: determine if these ids represent edges
    const s = String(histItem?.code || '');
    const isEdgeQuery = /\.(E|addE|outE|inE|bothE)\s*\(/.test(s);
    for (const it of items) {
      if (it && typeof it === 'object' && ('id' in it)) {
        // Allow payload to specify kind/type explicitly if present
        const kind = String(it.kind || it.type || (isEdgeQuery ? 'edge' : 'vertex')).toLowerCase() === 'edge' ? 'edge' : 'vertex';
        wanted.push({ id: it.id, label: it.label, kind });
      } else if (typeof it === 'string' || typeof it === 'number') {
        wanted.push({ id: it, kind: isEdgeQuery ? 'edge' : 'vertex' });
      }
    }
    if (!wanted.length) return;

    // Filter out ids that already exist (by composite node id with kind prefix)
    const existing = new Set(graphNodes.map(n => n.id));
    const toAdd = wanted.filter(w => !existing.has(`${w.kind === 'edge' ? 'e' : 'v'}:${String(w.id)}`));
    if (!toAdd.length) return;

    // Fetch labels for ids missing label, separately for vertices and edges
    const needLabelV = toAdd.filter(w => (w.kind !== 'edge') && (typeof w.label === 'undefined' || w.label === null));
    if (needLabelV.length) {
      const ids = needLabelV.map(w => JSON.stringify(String(w.id))).join(',');
      try {
        const codeText = `const ids = [${ids}]; const out=[]; for (const id of ids) { const label = await graph().V(id).label(); out.push({ id, label }); } return out`;
        const res = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: codeText }) });
        const json = await res.json().catch(() => ({}));
        const labeled = Array.isArray(json?.result) ? json.result : [];
        const byId = new Map(labeled.map(v => [String(v.id), v.label]));
        for (const w of toAdd) { if (w.kind !== 'edge' && byId.has(String(w.id))) w.label = byId.get(String(w.id)); }
      } catch { /* ignore */ }
    }
    const needLabelE = toAdd.filter(w => (w.kind === 'edge') && (typeof w.label === 'undefined' || w.label === null));
    if (needLabelE.length) {
      const ids = needLabelE.map(w => JSON.stringify(String(w.id))).join(',');
      try {
        const codeText = `const ids = [${ids}]; const out=[]; for (const id of ids) { const label = await graph().E(id).label(); out.push({ id, label }); } return out`;
        const res = await fetch('/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: codeText }) });
        const json = await res.json().catch(() => ({}));
        const labeled = Array.isArray(json?.result) ? json.result : [];
        const byId = new Map(labeled.map(v => [String(v.id), v.label]));
        for (const w of toAdd) { if (w.kind === 'edge' && byId.has(String(w.id))) w.label = byId.get(String(w.id)); }
      } catch { /* ignore */ }
    }

    // Append new nodes with computed positions
    setGraphNodes(prev => {
      let idx = prev.length;
      const next = [...prev];
      for (const w of toAdd) {
        const isEdge = w.kind === 'edge';
        next.push({
          id: `${isEdge ? 'e' : 'v'}:${String(w.id)}`,
          type: 'io',
          position: computePos(idx++),
          data: {
            label: isEdge ? 'Edge' : 'Vertex',
            typeIn: '—',
            typeOut: isEdge ? 'Edge' : 'Vertex',
            info: { id: w.id, label: w.label ?? '', kind: isEdge ? 'edge' : 'vertex' },
          },
        });
      }
      return next;
    });
  }, [graphNodes, computePos]);

  return (
    <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Graph API Flow</h1>
        <span
          title={opType === 'mutation' ? 'Detected mutating operations (addV/addE/property/drop)' : 'Detected read-only operations'}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid',
            color: opType === 'mutation' ? '#7c2d12' : '#065f46',
            background: opType === 'mutation' ? '#ffedd5' : '#ecfdf5',
            borderColor: opType === 'mutation' ? '#fdba74' : '#a7f3d0',
          }}
        >{opType.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, flex: '0 0 auto' }}>
        <div style={{ flex: '1 1 0%', minWidth: 0 }}>
          <div style={{ margin: '8px 0 12px 0' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Command (server block)</div>
            <CodeEditor value={code} onChange={setCode} placeholder={defaultCode} />
            {/* Server manages dependencies; client does not pass any */}
          </div>
          <div>
            <button onClick={() => runCommand()} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>Run</button>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Output</div>
              <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>{output}</pre>
            </div>
          </div>
        </div>
        <div style={{ flex: '0 1 40%', maxWidth: '50%' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>History</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
            {history.map((h, idx) => (
              <li key={h.ts + ':' + idx} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, background: '#fafafa' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.code}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <button onClick={() => runCommand(h.code)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc' }}>Run</button>
                  <button onClick={() => setCode(h.code)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc' }}>Load</button>
                  <button onClick={() => addFromHistory(h)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc' }}>Add to graph</button>
                </div>
              </li>
            ))}
            {history.length === 0 && <li style={{ color: '#6b7280' }}>No commands yet.</li>}
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0', flex: '0 0 auto' }}>
          <h2 style={{ margin: 0 }}>Graph</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveGraph} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>Save Graph</button>
            <button onClick={clearGraph} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>Clear Graph</button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <ReactFlow
            style={{ width: '100%', height: '100%' }}
            nodes={useMemo(() => graphNodes.map(n => ({
              ...n,
              data: {
                ...n.data,
              }
            })), [graphNodes])}
            edges={graphEdges}
            onNodesChange={onGraphNodesChange}
            onEdgesChange={onGraphEdgesChange}
            onNodeMouseEnter={(_, n) => setHoveredGraphNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredGraphNodeId(null)}
            nodeTypes={{ io: IONode, terminal: TerminalNode, resource: ResourceNode }}
            fitView
          >
            <Background size={1} color="#eee" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <div style={{ marginTop: 12, padding: 12, border: '1px dashed #e5e7eb', borderRadius: 8, background: '#fafafa', flex: '0 0 auto' }}>
        This page focuses on the command runner. To edit the graph layout, visit the Schema page.
        <a href="/schema" style={{ marginLeft: 8, color: '#2563eb', textDecoration: 'none' }}>Open Graph Schema →</a>
        </div>
      </div>
      {/* Local-only persistence is automatic via localStorage; no server save */}
    </section>
  )
}

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

function IONode({ data }) {
  const typeKey = data.kind === 'resource' && data.resourceType ? `resource:${data.resourceType}` : (data.kind || data.label);
  const typeIn = data.typeIn ?? TYPE_MAP[typeKey]?.in ?? '—';
  const typeOut = data.typeOut ?? TYPE_MAP[typeKey]?.out ?? '—';
  if (data.info) {
    return (
      <div style={{
        padding: '8px 12px 12px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        minWidth: 180,
        position: 'relative',
      }}>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ fontWeight: 700, marginBottom: 6, userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text', cursor: 'text' }}
        >
          {String(data.info.kind) === 'edge' ? 'Edge' : 'Vertex'}
        </div>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ fontSize: 12, lineHeight: 1.4, userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text', cursor: 'text' }}
        >
          <div>
            <span style={{ color: '#6b7280' }}>id:</span>{' '}
            <code style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>{String(data.info.id ?? '')}</code>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>label:</span>{' '}
            <code style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>{String(data.info.label ?? '')}</code>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div style={{
      padding: '6px 10px 18px',
      background: data.highlighted ? '#eff6ff' : '#fff',
      border: '2px solid',
      borderColor: data.highlighted ? '#2563eb' : '#ccc',
      borderRadius: 6,
      boxShadow: data.highlighted ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
      transition: 'all 120ms ease-in-out',
      position: 'relative',
      minWidth: 120,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
          {data.kind && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', whiteSpace: 'nowrap' }}>{data.kind}</span>
          )}
        </div>
        {data.op && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 6px', borderRadius: 999,
            border: '1px solid',
            color: data.op === 'mutation' ? '#7c2d12' : '#065f46',
            background: data.op === 'mutation' ? '#ffedd5' : '#ecfdf5',
            borderColor: data.op === 'mutation' ? '#fdba74' : '#a7f3d0',
            whiteSpace: 'nowrap'
          }}>
            {data.op.toUpperCase()}
          </span>
        )}
      </div>
      {data.label === 'properties' && data.details && (data.details.keys?.length > 0 || data.details.setKeys?.length > 0) && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#374151' }}>
          {data.details.keys?.length > 0 && (
            <div>get: <span style={{ fontFamily: 'monospace' }}>{data.details.keys.join(', ')}</span></div>
          )}
          {data.details.setKeys?.length > 0 && (
            <div>set: <span style={{ fontFamily: 'monospace' }}>{data.details.setKeys.join(', ')}</span></div>
          )}
        </div>
      )}
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
      boxShadow: data.highlighted ? '0 0 0 2px rgba(96,165,250,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 120ms ease-in-out',
      position: 'relative',
      minWidth: 160,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
        {data.op && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 6px', borderRadius: 999,
            border: '1px solid',
            color: data.op === 'mutation' ? '#7c2d12' : '#065f46',
            background: data.op === 'mutation' ? '#fff7ed' : '#ecfdf5',
            borderColor: data.op === 'mutation' ? '#fed7aa' : '#a7f3d0',
            whiteSpace: 'nowrap'
          }}>
            {data.op.toUpperCase()}
          </span>
        )}
      </div>
      {data.label === 'properties' && data.details && (data.details.keys?.length > 0 || data.details.setKeys?.length > 0) && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#374151' }}>
          {data.details.keys?.length > 0 && (
            <div>get: <span style={{ fontFamily: 'monospace' }}>{data.details.keys.join(', ')}</span></div>
          )}
          {data.details.setKeys?.length > 0 && (
            <div>set: <span style={{ fontFamily: 'monospace' }}>{data.details.setKeys.join(', ')}</span></div>
          )}
        </div>
      )}
      <span style={{ position: 'absolute', left: 8, bottom: 4, fontSize: 10, color: '#6b7280' }}>in: {typeIn}</span>
      <span style={{ position: 'absolute', right: 8, bottom: 4, fontSize: 10, color: '#6b7280' }}>out: {typeOut}</span>
    </div>
  )
}

// Resource node: represents a generic resource (Vertex or Edge)
function ResourceNode({ data }) {
  const typeKey = data.kind === 'resource' && data.resourceType ? `resource:${data.resourceType}` : (data.kind || 'resource');
  const typeIn = data.typeIn ?? TYPE_MAP[typeKey]?.in ?? '—';
  const typeOut = data.typeOut ?? TYPE_MAP[typeKey]?.out ?? '—';
  const badgeText = data.kind === 'resource' ? 'RESOURCE' : (data.op ? String(data.op).toUpperCase() : '');
  return (
    <div style={{
      padding: '6px 10px 18px',
      background: data.highlighted ? '#f5f3ff' : '#f8fafc',
      color: '#111827',
      border: '1px solid',
      borderColor: data.highlighted ? '#c4b5fd' : '#e5e7eb',
      borderRadius: 10,
      boxShadow: data.highlighted ? '0 0 0 2px rgba(196,181,253,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
      transition: 'all 120ms ease-in-out',
      position: 'relative',
      minWidth: 140,
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
        </div>
        {badgeText && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '2px 6px', borderRadius: 999,
            border: '1px solid',
            color: data.kind === 'resource' ? '#374151' : (data.op === 'mutation' ? '#7c2d12' : '#065f46'),
            background: data.kind === 'resource' ? '#f3f4f6' : (data.op === 'mutation' ? '#fff7ed' : '#ecfdf5'),
            borderColor: data.kind === 'resource' ? '#e5e7eb' : (data.op === 'mutation' ? '#fed7aa' : '#a7f3d0'),
            whiteSpace: 'nowrap'
          }}>
            {badgeText}
          </span>
        )}
      </div>
      <span style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>in: {typeIn}</span>
      <span style={{ position: 'absolute', right: 6, bottom: 4, fontSize: 10, color: '#6b7280' }}>out: {typeOut}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Heuristic: detect which API nodes are referenced by code
function computeHighlights(codeText = '') {
  try {
    const s = String(codeText);
    const found = new Set();
    if (/graph\s*\(/.test(s)) found.add('graph');
    if (/\.addV\s*\(/.test(s)) found.add('addV');
    if (/\.addE\s*\(/.test(s)) found.add('addE');
    if (/\.V\s*\(/.test(s)) found.add('V');
    if (/\.E\s*\(/.test(s)) found.add('E');
    if (/\.out\s*\(/.test(s)) found.add('out');
    if (/\.outE\s*\(/.test(s)) found.add('outE');
    if (/\.in\s*\(/.test(s)) found.add('in');
    if (/\.inE\s*\(/.test(s)) found.add('inE');
    if (/\.outV\s*\(/.test(s)) found.add('outV');
    if (/\.inV\s*\(/.test(s)) found.add('inV');
    if (/\.bothV\s*\(/.test(s)) found.add('bothV');
    if (/\.otherV\s*\(/.test(s)) found.add('otherV');
    if (/\.bothE\s*\(/.test(s)) found.add('bothE');
    if (/\.V\s*\(/.test(s) || /\.addV\s*\(/.test(s)) found.add('resource');
    if (/\.property\s*\(/.test(s)) found.add('property');
    if (/\.has\s*\(/.test(s)) found.add('has');
    if (/\.properties\s*\(/.test(s)) found.add('properties');
    if (/\.id\s*\(\s*\)/.test(s) || /\.id\s*\(/.test(s)) found.add('id');
    if (/\.label\s*\(\s*\)/.test(s) || /\.label\s*\(/.test(s)) found.add('label');
    if (/\.drop\s*\(/.test(s)) found.add('drop');
    if (/\.valueMap\s*\(/.test(s)) found.add('valueMap');
    // If terminal usages exist, mark terminal too
    if (found.has('id') || found.has('label')) found.add('terminal');
    return Array.from(found);
  } catch {
    return [];
  }
}

function computeOpType(codeText = '') {
  try {
    const s = String(codeText);
    const isMutation = /\.(addV|addE|property|drop)\s*\(/.test(s);
    return isMutation ? 'mutation' : 'query';
  } catch {
    return 'query';
  }
}

// Per-node operation classification based on current code
function computeNodeOps(codeText = '') {
  try {
    const s = String(codeText);
    const ops = {};
    const used = (re) => re.test(s);
    const hasAddV = used(/\.addV\s*\(/);
    const hasAddE = used(/\.addE\s*\(/);
    const hasOut = used(/\.out\s*\(/);
    const hasOutE = used(/\.outE\s*\(/);
    const hasIn = used(/\.in\s*\(/);
    const hasInE = used(/\.inE\s*\(/);
    const hasOutV = used(/\.outV\s*\(/);
    const hasInV = used(/\.inV\s*\(/);
    const hasBothV = used(/\.bothV\s*\(/);
    const hasOtherV = used(/\.otherV\s*\(/);
    const hasBothE = used(/\.bothE\s*\(/);
    const hasProp = used(/\.property\s*\(/);
    const hasHas = used(/\.has\s*\(/);
    const hasProps = used(/\.properties\s*\(/);
    const hasValueMap = used(/\.valueMap\s*\(/);
    const hasDrop = used(/\.drop\s*\(/);
    const hasId = used(/\.id\s*\(/);
    const hasLabel = used(/\.label\s*\(/);
    const hasV = used(/\.V\s*\(/);
    const hasE = used(/\.E\s*\(/);

    if (hasAddV) ops['addV'] = 'mutation';
    if (hasAddE) ops['addE'] = 'mutation';
    if (hasOut) ops['out'] = 'query';
    if (hasOutE) ops['outE'] = 'query';
    if (hasIn) ops['in'] = 'query';
    if (hasInE) ops['inE'] = 'query';
    if (hasOutV) ops['outV'] = 'query';
    if (hasInV) ops['inV'] = 'query';
    if (hasBothV) ops['bothV'] = 'query';
    if (hasOtherV) ops['otherV'] = 'query';
    if (hasBothE) ops['bothE'] = 'query';
    if (hasProp) ops['property'] = 'mutation';
    if (hasHas) ops['has'] = 'query';
    if (hasDrop) { ops['V'] = 'mutation'; ops['E'] = 'mutation'; }
    if (hasProps) ops['properties'] = 'query';
    if (hasId) ops['id'] = 'query';
    if (hasLabel) ops['label'] = 'query';
    if (hasValueMap) ops['valueMap'] = 'query';
    if (hasV && !ops['V']) ops['V'] = (hasProp || hasDrop) ? 'mutation' : 'query';
    if (hasE && !ops['E']) ops['E'] = (hasProp || hasDrop) ? 'mutation' : 'query';
    if ((hasV || hasAddV) && !ops['resource']) ops['resource'] = (hasProp || hasDrop) ? 'mutation' : 'query';
    if (used(/graph\s*\(/)) ops['graph'] = (hasAddV || hasAddE || hasProp || hasDrop) ? 'mutation' : 'query';
    if (ops['id'] || ops['label']) ops['terminal'] = 'query';
    return ops;
  } catch {
    return {};
  }
}

// Extract properties-related info from the code
function computePropertiesInfo(codeText = '') {
  const info = { keys: [], setKeys: [] };
  try {
    const s = String(codeText);
    // .properties('key') occurrences
    const reGet = /\.properties\s*\(\s*(["'`])([^"'`]+)\1\s*\)/g;
    let m;
    const keys = new Set();
    while ((m = reGet.exec(s))) keys.add(m[2]);
    // .property('key', ...) setter occurrences
    const reSet = /\.property\s*\(\s*(["'`])([^"'`]+)\1\s*,/g;
    const setKeys = new Set();
    while ((m = reSet.exec(s))) setKeys.add(m[2]);
    info.keys = Array.from(keys);
    info.setKeys = Array.from(setKeys);
  } catch { /* ignore parse errors */ }
  return info;
}

// Client-only code editor with Prism highlighting
const Editor = dynamic(() => import('react-simple-code-editor'), { ssr: false });
function CodeEditor({ value, onChange, placeholder }) {
  const highlight = useCallback((code) => Prism.highlight(code, Prism.languages.javascript, 'javascript'), []);
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden' }}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={10}
        placeholder={placeholder}
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          minHeight: 140,
          outline: 'none',
          background: '#fff',
        }}
      />
    </div>
  );
}
