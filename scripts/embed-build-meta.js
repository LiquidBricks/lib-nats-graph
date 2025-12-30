#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

let commit = 'unknown';
let dirty = false;
let branch = 'unknown';

try {
  commit = sh('git rev-parse --short=12 HEAD');
  dirty = !!sh('git status --porcelain');
  branch = sh('git rev-parse --abbrev-ref HEAD');
} catch {
  // Running outside of git (e.g., tarball); keep defaults.
}

const meta = {
  commit,
  branch,
  dirty,
  buildTime: new Date().toISOString(),
  node: process.version,
};

const jsModule = `export default ${JSON.stringify(meta, null, 2)};\n`;

writeFileSync('build-meta.js', jsModule);
console.log('Wrote build-meta.js', meta);
