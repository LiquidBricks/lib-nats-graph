export const keyExists = async (kvStore, keyOrPattern) => {
  const itr = await kvStore.keys(keyOrPattern)
  const { done, value } = await itr[Symbol.asyncIterator]().next()
  return !done && value !== undefined
}

export const getStringOrNull = async (kvStore, key) => {
  try {
    return await kvStore.get(key).then((d) => d.string())
  } catch {
    return null
  }
}

export const getJsonArrayOrEmpty = async (kvStore, key) => {
  const raw = await kvStore.get(key).then((d) => d.string()).catch(() => '[]')
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const removeFromJsonArray = async (kvStore, key, value) => {
  const next = (await getJsonArrayOrEmpty(kvStore, key)).filter(
    (entry) => String(entry) !== String(value),
  )
  await kvStore.update(key, JSON.stringify(next)).catch(() => { })
}

export const pushUniqueToJsonArray = async (kvStore, key, value) => {
  const items = await getJsonArrayOrEmpty(kvStore, key)
  if (!items.includes(value)) {
    items.push(value)
    await kvStore.update(key, JSON.stringify(items)).catch(() => { })
  }
}

export const ADJ_CHUNK_SIZE = 256

const parseJsonObject = (raw, fallback) => {
  try {
    const value = JSON.parse(raw || '')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

export const appendToChunkedSet = async (kvStore, { metaKey, chunkKeyForIndex, value, chunkSize = ADJ_CHUNK_SIZE }) => {
  if (!kvStore) return
  const meta = parseJsonObject(await kvStore.get(metaKey).then(d => d.string()).catch(() => ''), { tail: -1, count: 0 })
  const tailIndex = meta.tail >= 0 ? meta.tail : 0

  let chunk = await kvStore.get(chunkKeyForIndex(tailIndex)).then(d => d.string()).then(raw => JSON.parse(raw || '[]')).catch(() => [])
  if (!Array.isArray(chunk)) chunk = []

  if (chunk.length >= chunkSize && chunkSize > 0) {
    const nextIndex = tailIndex + 1
    chunk = [value]
    await kvStore.put(chunkKeyForIndex(nextIndex), JSON.stringify(chunk)).catch(() => { })
    meta.tail = nextIndex
  } else {
    chunk.push(value)
    await kvStore.put(chunkKeyForIndex(meta.tail >= 0 ? meta.tail : 0), JSON.stringify(chunk)).catch(() => { })
    if (meta.tail < 0) meta.tail = 0
  }
  meta.count = (meta.count || 0) + 1
  await kvStore.put(metaKey, JSON.stringify(meta)).catch(() => { })
}

export const readChunkedSet = async (kvStore, { metaKey, chunkKeyForIndex, limit }) => {
  if (!kvStore) return []
  const meta = parseJsonObject(await kvStore.get(metaKey).then(d => d.string()).catch(() => ''), { tail: -1, count: 0 })
  if (meta.tail < 0) return []
  const results = []
  for (let i = 0; i <= meta.tail; i++) {
    const raw = await kvStore.get(chunkKeyForIndex(i)).then(d => d.string()).catch(() => '[]')
    let arr
    try { arr = JSON.parse(raw || '[]') } catch { arr = [] }
    if (!Array.isArray(arr)) continue
    for (const v of arr) {
      results.push(v)
      if (limit && results.length >= limit) return results
    }
  }
  return results
}

export const removeFromChunkedSet = async (kvStore, { metaKey, chunkKeyForIndex, value }) => {
  if (!kvStore) return
  const meta = parseJsonObject(await kvStore.get(metaKey).then(d => d.string()).catch(() => ''), { tail: -1, count: 0 })
  if (meta.tail < 0) return
  let removed = 0
  let lastNonEmpty = -1
  for (let i = 0; i <= meta.tail; i++) {
    const key = chunkKeyForIndex(i)
    const raw = await kvStore.get(key).then(d => d.string()).catch(() => '[]')
    let arr
    try { arr = JSON.parse(raw || '[]') } catch { arr = [] }
    if (!Array.isArray(arr)) continue
    const next = arr.filter((entry) => String(entry) !== String(value))
    if (next.length !== arr.length) {
      removed += arr.length - next.length
      if (next.length === 0) {
        await kvStore.delete(key).catch(() => { })
      } else {
        await kvStore.put(key, JSON.stringify(next)).catch(() => { })
        lastNonEmpty = i
      }
    } else if (next.length > 0) {
      lastNonEmpty = i
    }
  }
  meta.tail = lastNonEmpty
  meta.count = Math.max((meta.count || 0) - removed, 0)
  if (meta.tail < 0) {
    await kvStore.delete(metaKey).catch(() => { })
  } else {
    await kvStore.put(metaKey, JSON.stringify(meta)).catch(() => { })
  }
}
