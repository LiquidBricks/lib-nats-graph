import { graph as natsGraph } from '../../../graph/graph.js'
import createNatsContext from '@liquid-bricks/lib-nats-context';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const natsContext = createNatsContext({ servers: "10.88.0.93" })
    await natsContext.client()
    const { code } = req.body || {};

    const ts = new Date().toISOString();
    const ua = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';

    // Require code-only; legacy single-expression commands are no longer supported
    if (typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'code required' });
    }

    // Execute a code block with server-provided dependencies only
    console.log('[dashboard/api/command]', { ts, ip, ua, mode: 'block' });

    // Wrap in an async IIFE to allow top-level await and return
    const fn = new Function(
      'graph',
      'console',
      `"use strict"; return (async () => { ${code}\n })();`
    );

    // Inject server-side dependencies here (extendable later)
    const result = await Promise.resolve(fn(natsGraph, console));
    return res.status(200).json({ ok: true, result: safeSerialize(result) });
  } catch (err) {
    console.error('[dashboard/api/command] error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
}

function safeSerialize(v) {
  try {
    // Pass through primitives and plain JSON
    if (v == null) return v;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
    return JSON.parse(JSON.stringify(v));
  } catch (_) {
    try { return String(v) } catch { return undefined }
  }
}
