import fs from 'node:fs/promises'
import path from 'node:path'

const stateFile = path.join(process.cwd(), 'dashboardState.json')

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await readState();
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === 'POST') {
      const body = (req.body && Object.keys(req.body).length ? req.body : await parseJSON(req)) || {};
      const incoming = body?.data;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ ok: false, error: 'data object required' });
      }
      const current = await readState();
      let next = { ...current, ...incoming };

      // Explicit pruning/removal logic
      const currLayout = current.layout || {};
      const incLayout = (incoming.layout && typeof incoming.layout === 'object') ? incoming.layout : {};

      // 1) If caller supplies removeNodeIds, drop those nodes and any edges referencing them
      const removeNodeIds = Array.isArray(body.removeNodeIds) ? new Set(body.removeNodeIds) : null;
      if (removeNodeIds && removeNodeIds.size > 0) {
        const existingNodes = Array.isArray(currLayout.nodes) ? currLayout.nodes : [];
        const existingEdges = Array.isArray(currLayout.edges) ? currLayout.edges : [];
        const prunedNodes = existingNodes.filter(n => !removeNodeIds.has(n?.id));
        const prunedEdges = existingEdges.filter(e => !removeNodeIds.has(e?.source) && !removeNodeIds.has(e?.target));
        next.layout = {
          ...currLayout,
          nodes: prunedNodes,
          edges: prunedEdges,
        };
      }

      // 2) If caller supplies layout.nodes, replace nodes with incoming and prune edges that point to removed nodes
      if (Array.isArray(incLayout.nodes)) {
        const keepIds = new Set(incLayout.nodes.map(n => n?.id).filter(Boolean));
        // Replace nodes with the incoming set
        const newNodes = incLayout.nodes;
        let newEdges;
        if (Array.isArray(incLayout.edges)) {
          // Caller provided edges explicitly — accept as-is
          newEdges = incLayout.edges;
        } else {
          // Caller didn't provide edges — prune existing edges that reference removed nodes
          const existingEdges = Array.isArray(currLayout.edges) ? currLayout.edges : [];
          newEdges = existingEdges.filter(e => keepIds.has(e?.source) && keepIds.has(e?.target));
        }
        next.layout = {
          ...(next.layout || currLayout),
          ...incLayout,
          nodes: newNodes,
          edges: newEdges,
        };
      } else if (Array.isArray(incLayout.edges)) {
        // 3) Only edges provided — replace edges (no node changes)
        next.layout = {
          ...(next.layout || currLayout),
          edges: incLayout.edges,
        };
      }

      // await fs.writeFile(stateFile, JSON.stringify(next, null, 2));
      return res.status(200).json({ ok: true, data: next });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[dashboard/api/dashboard] error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
}

async function readState() {
  try {
    const raw = await fs.readFile(stateFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseJSON(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) }
    });
  })
}
