import { kvProvider as natsKVProvider } from "./nats/provider.js";
import { kvProvider as memoryKVProvider } from "./memory/provider.js";
import { kvProvider as redisKVProvider } from "./redis/provider.js";

export function kvProviderFactory(kvName) {
  switch (kvName) {
    case 'nats':
      return natsKVProvider
    case 'memory':
      return memoryKVProvider
    case 'redis':
      return redisKVProvider
    default:
      throw new Error(`Unsupported kv provider: ${kvName}`)
  }
}
