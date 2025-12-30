import { createHash } from 'node:crypto'

const meta = {
  "commit": "85d07063fe5c",
  "branch": "main",
  "dirty": true,
  "buildTime": "2025-11-14T04:27:51.543Z",
  "node": "v22.6.0"
}

const packageHash = createHash('sha1').update(JSON.stringify(meta)).digest('hex')

export default {
  ...meta,
  packageHash,
};
