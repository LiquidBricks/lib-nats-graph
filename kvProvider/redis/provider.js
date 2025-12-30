import { createClient } from 'redis'

export const KVProviderErrors = {
  CONFIG_REQUIRED: 'E_KV_PROVIDER_CONFIG_REQUIRED',
  URL_REQUIRED: 'E_KV_PROVIDER_URL_REQUIRED',
  PREFIX_REQUIRED: 'E_KV_PROVIDER_PREFIX_REQUIRED',
}

export async function kvProvider({ config = {}, ctx: { diagnostics } = {} } = {}) {
  const requireConfig = (condition, code, message) => {
    if (diagnostics?.require) {
      diagnostics.require(condition, code, message)
      return
    }
    if (!condition) throw new Error(message || code)
  }

  requireConfig(
    config && typeof config === 'object',
    KVProviderErrors.CONFIG_REQUIRED,
    'Invalid config: expected an object'
  )

  const {
    url,
    keyPrefix = 'nats-graph',
    database,
  } = config
  const selectedDb = Number.isFinite(Number(database)) ? Number(database) : undefined

  requireConfig(
    !!url,
    KVProviderErrors.URL_REQUIRED,
    'Missing config.url: Redis connection string required'
  )
  requireConfig(
    keyPrefix && typeof keyPrefix === 'string',
    KVProviderErrors.PREFIX_REQUIRED,
    'Missing config.keyPrefix: Prefix required to namespace keys'
  )

  const client = createClient({ url, database: selectedDb })
  await client.connect()

  const metaPrefix = `${keyPrefix}:__meta__`
  const revisionKey = `${metaPrefix}:rev`
  const redisKey = (key) => `${keyPrefix}:${key}`

  const normalize = (payload) => {
    if (payload === undefined) return Buffer.alloc(0)
    if (typeof payload === 'string') return Buffer.from(payload)
    if (payload instanceof Uint8Array) return Buffer.from(payload)
    if (Buffer.isBuffer(payload)) return payload
    throw new TypeError('Unsupported payload type')
  }

  const toHelpers = ({ value, rev, deleted }) => {
    const buf = Buffer.isBuffer(value) ? value : Buffer.alloc(0)
    const helpers = {
      string: () => buf.toString('utf8'),
      json: () => JSON.parse(buf.toString('utf8') || 'null'),
      rev,
      deleted: !!deleted,
    }
    return helpers
  }

  const nextRevision = async () => Number(await client.incr(revisionKey))

  const readEntry = async (key) => {
    const raw = await client.hGetAll(redisKey(key))
    if (!raw || Object.keys(raw).length === 0) return null
    return {
      value: raw.value ? Buffer.from(raw.value, 'base64') : Buffer.alloc(0),
      rev: Number(raw.rev) || 0,
      deleted: raw.deleted === '1',
    }
  }

  const writeEntry = async ({ key, value, deleted }) => {
    const rev = await nextRevision()
    await client.hSet(redisKey(key), {
      value: value.toString('base64'),
      rev: String(rev),
      deleted: deleted ? '1' : '0',
    })
    return rev
  }

  const get = async (key) => {
    const entry = await readEntry(key)
    if (!entry) return null
    return toHelpers(entry)
  }

  const put = async (key, payload) => {
    const value = normalize(payload)
    return writeEntry({ key, value, deleted: false })
  }

  const update = async (key, payload, expectedRevision) => {
    if (expectedRevision !== undefined) {
      const current = await readEntry(key)
      if (current && current.rev !== expectedRevision) {
        throw new Error('Revision mismatch')
      }
    }
    return put(key, payload)
  }

  const create = async (key, payload) => {
    const current = await readEntry(key)
    if (current && !current.deleted) throw new Error('Key already exists')
    const value = normalize(payload)
    return writeEntry({ key, value, deleted: false })
  }

  const del = async (key) => {
    const value = Buffer.alloc(0)
    return writeEntry({ key, value, deleted: true })
  }

  const validatePattern = (p) => {
    if (typeof p !== 'string') throw new TypeError('Pattern must be a string')
    if (p === '>') return ['>']
    if (p === '') throw new TypeError('Empty pattern not allowed')
    const tokens = p.split('.')
    if (tokens.some(t => t.length === 0)) throw new TypeError('Invalid subject: empty token')
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.includes('*') && t !== '*') throw new TypeError('Invalid token wildcard')
      if (t.includes('>') && t !== '>') throw new TypeError('Invalid tail wildcard token')
      if (t === '>' && i !== tokens.length - 1) throw new TypeError('Tail wildcard must be last token')
    }
    return tokens
  }

  const match = (tokens, key) => {
    if (tokens.length === 1 && tokens[0] === '>') return true
    const ks = key.split('.')
    let i = 0
    for (; i < tokens.length; i++) {
      const pt = tokens[i]
      if (pt === '>') return true
      const kt = ks[i]
      if (kt === undefined) return false
      if (pt === '*') continue
      if (pt !== kt) return false
    }
    return ks.length === tokens.length
  }

  const toMatchers = (patternInput) => {
    if (!patternInput || patternInput === '>') return null
    const arr = Array.isArray(patternInput) ? Array.from(new Set(patternInput)) : [patternInput]
    return arr.map(validatePattern)
  }

  const keys = async (patternInput) => {
    const matchers = toMatchers(patternInput)
    const seen = new Set()
    const prefixMatch = `${keyPrefix}:`
    return (async function* () {
      for await (const rawKey of client.scanIterator({ MATCH: `${prefixMatch}*` })) {
        if (rawKey.startsWith(metaPrefix)) continue
        const key = rawKey.startsWith(prefixMatch) ? rawKey.slice(prefixMatch.length) : rawKey
        if (seen.has(key)) continue
        if (matchers) {
          let matched = false
          for (const tokens of matchers) {
            if (match(tokens, key)) {
              matched = true
              break
            }
          }
          if (!matched) continue
        }
        const entry = await readEntry(key)
        if (!entry || entry.deleted) continue
        seen.add(key)
        yield key
      }
    })()
  }

  const close = async () => {
    try {
      await client.quit()
    } catch {
      try { client.disconnect?.() } catch { }
    }
  }

  return {
    interface: { get, put, update, delete: del, keys, create },
    close
  }
}
