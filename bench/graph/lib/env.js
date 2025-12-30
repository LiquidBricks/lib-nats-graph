import os from 'node:os'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { natsProviderConfig } from '../../providers/nats.js'
import { redisProviderConfig } from '../../providers/redis.js'
import { memoryProviderConfig } from '../../providers/memory.js'

const providerLoaders = {
  nats: natsProviderConfig,
  redis: redisProviderConfig,
  memory: memoryProviderConfig,
}

export function resolveProviderConfig(provider) {
  const loader = providerLoaders[provider]
  if (!loader) throw new Error(`Unsupported provider: ${provider}`)
  const config = loader()
  return {
    provider: config.provider ?? provider,
    kvConfig: config.kvConfig ?? {},
  }
}

export function readGitSha(cwd = process.cwd()) {
  try {
    const out = execSync('git rev-parse HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
    return out.toString().trim()
  } catch {
    return null
  }
}

export function systemInfo() {
  const cpus = os.cpus() || []
  return {
    node: process.version,
    platform: `${os.platform()} ${os.release()}`,
    cpu: cpus[0]?.model || 'unknown',
    cores: cpus.length || 0,
  }
}

export function buildMeta({ provider, suites, benchConfig }) {
  return {
    timestamp: new Date().toISOString(),
    provider,
    suites,
    benchConfig,
    gitSha: readGitSha(),
    env: systemInfo(),
    cwd: path.resolve('.'),
  }
}
