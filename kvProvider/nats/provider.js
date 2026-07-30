import createNatsContext from "@liquid-bricks/lib-nats-context";
import { E_KV_PROVIDER_BUCKET_REQUIRED, E_KV_PROVIDER_CONFIG_REQUIRED, E_KV_PROVIDER_SERVERS_REQUIRED } from '@liquid-bricks/lib-diagnostics/codes';

export async function kvProvider({ config = {}, ctx: {
  diagnostics
} } = {}) {
  diagnostics.require(
    config && typeof config === 'object',
    E_KV_PROVIDER_CONFIG_REQUIRED,
    'Invalid config: expected an object'
  );
  const { servers, bucket } = config
  diagnostics.require(
    servers,
    E_KV_PROVIDER_SERVERS_REQUIRED,
    'Missing config.servers: NATS server address required'
  );
  diagnostics.require(
    bucket,
    E_KV_PROVIDER_BUCKET_REQUIRED,
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
