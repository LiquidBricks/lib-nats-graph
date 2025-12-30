import createNatsContext from "@liquid-bricks/lib-nats-context";

// Centralized error codes for this provider
export const KVProviderErrors = {
  CONFIG_REQUIRED: 'E_KV_PROVIDER_CONFIG_REQUIRED',
  SERVERS_REQUIRED: 'E_KV_PROVIDER_SERVERS_REQUIRED',
  BUCKET_REQUIRED: 'E_KV_PROVIDER_BUCKET_REQUIRED',
}

export async function kvProvider({ config = {}, ctx: {
  diagnostics
} } = {}) {
  diagnostics.require(
    config && typeof config === 'object',
    KVProviderErrors.CONFIG_REQUIRED,
    'Invalid config: expected an object'
  );
  const { servers, bucket } = config
  diagnostics.require(
    servers,
    KVProviderErrors.SERVERS_REQUIRED,
    'Missing config.servers: NATS server address required'
  );
  diagnostics.require(
    bucket,
    KVProviderErrors.BUCKET_REQUIRED,
    'Missing config.bucket: KV bucket name required'
  );

  const natsContext = createNatsContext({ servers })
  const connBucket = await natsContext.bucket(bucket)
  return {
    close: natsContext.close,
    interface: {
      get get() { return connBucket.get.bind(connBucket) },
      get update() { return connBucket.update.bind(connBucket) },
      get put() { return connBucket.put.bind(connBucket) },
      get delete() { return connBucket.delete.bind(connBucket) },
      get keys() { return connBucket.keys.bind(connBucket) },
      get create() { return connBucket.create.bind(connBucket) },
    }
  }
}
