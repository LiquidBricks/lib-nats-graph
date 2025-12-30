#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'

const PUBLIC_DIR = path.resolve(import.meta.dirname)
const DEFAULT_PAGE = 'chart.html'
const REPO_ROOT = path.resolve(PUBLIC_DIR, '..')
const BENCH_RESULTS_DIR = path.join(REPO_ROOT, 'bench-results')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function resolvePath(requestedPath) {
  const normalized = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '')
  if (normalized === '/bench-results' || normalized.startsWith('/bench-results/')) {
    const rel = normalized.replace(/^\/bench-results\/?/, '')
    return path.join(BENCH_RESULTS_DIR, rel)
  }
  const base = normalized === '/' ? `/${DEFAULT_PAGE}` : normalized
  return path.join(PUBLIC_DIR, base)
}

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const target = resolvePath(url.pathname)

    const allowed =
      target.startsWith(PUBLIC_DIR) ||
      target.startsWith(BENCH_RESULTS_DIR)
    if (!allowed) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Access denied')
      return
    }

    const data = await fs.readFile(target)
    res.writeHead(200, {
      'Content-Type': getContentType(target),
      'Cache-Control': 'no-cache',
    })
    res.end(data)
  } catch (err) {
    if (err?.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Unexpected error')
  }
})

server.listen(0, () => {
  const address = server.address()
  const port = typeof address === 'object' ? address.port : address
  console.log(`Serving ${PUBLIC_DIR} on http://localhost:${port}/${DEFAULT_PAGE}`)
})
