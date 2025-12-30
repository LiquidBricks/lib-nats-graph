export async function kvProvider({ config = {}, ctx } = {}) {
  const store = new Map()
  let rev = 0

  const wrapHelpers = (entry) => {
    const helpers = helpersFor(entry.value)
    helpers.rev = entry.rev
    helpers.deleted = !!entry.deleted
    return helpers
  }

  const normalize = (payload) => {
    if (payload === undefined) return Buffer.alloc(0)
    if (typeof payload === 'string') return Buffer.from(payload)
    if (payload instanceof Uint8Array) return Buffer.from(payload)
    if (Buffer.isBuffer(payload)) return payload
    throw new TypeError('Unsupported payload type')
  }

  const helpersFor = (buf) => ({
    string: () => (Buffer.isBuffer(buf) ? buf.toString('utf8') : ''),
    json: () => JSON.parse(Buffer.isBuffer(buf) ? buf.toString('utf8') : 'null')
  })

  const get = async (key) => {
    if (!store.has(key)) return null
    const entry = store.get(key)
    return wrapHelpers(entry)
  }

  const put = async (key, payload) => {
    const value = normalize(payload)
    rev += 1
    store.set(key, { value, rev, deleted: false })
    return rev
  }

  const update = async (key, payload) => {
    return put(key, payload)
  }

  const create = async (key, payload) => {
    if (store.has(key) && !store.get(key)?.deleted) throw new Error('Key already exists')
    return put(key, payload)
  }

  const del = async (key) => {
    // represent deletes as empty payload to satisfy get().string() === ''
    const value = Buffer.alloc(0)
    rev += 1
    store.set(key, { value, rev, deleted: true })
  }

  const keys = async (pattern) => {
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
        if (pt === '>') {
          // matches remainder
          return true
        }
        const kt = ks[i]
        if (kt === undefined) return false
        if (pt === '*') continue
        if (pt !== kt) return false
      }
      // All pattern tokens consumed; only match if key has no extra tokens
      return ks.length === tokens.length
    }

    const patterns = Array.isArray(pattern) ? Array.from(new Set(pattern)) : pattern

    async function* itrSingle(p) {
      if (!p || p === '>') {
        for (const k of store.keys()) {
          const entry = store.get(k)
          if (entry?.deleted) continue
          yield k
        }
        return
      }
      const tokens = validatePattern(p)
      for (const k of store.keys()) {
        const entry = store.get(k)
        if (entry?.deleted) continue
        if (match(tokens, k)) yield k
      }
    }

    async function* itrMany(ps) {
      // validate all first
      const tokenList = ps.map(validatePattern)
      const seen = new Set()
      for (const k of store.keys()) {
        const entry = store.get(k)
        if (entry?.deleted) continue
        for (const tks of tokenList) {
          if (match(tks, k)) {
            if (!seen.has(k)) {
              seen.add(k)
              yield k
            }
            break
          }
        }
      }
    }

    return Array.isArray(patterns) ? itrMany(patterns) : itrSingle(patterns)
  }

  const close = async () => { }

  return {
    interface: { get, put, update, delete: del, keys, create },
    close
  }
}
