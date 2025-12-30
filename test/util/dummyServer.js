import net from 'node:net';

/**
 * Start a TCP server on an ephemeral port (port 0).
 * handler: (socket) => {} optional connection handler
 * returns an object { server, address, port, family, close() }.
 */
export async function startDummyServer(handler = () => { }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer(handler);

    server.once('error', reject);

    // Bind to 127.0.0.1 and port 0 => OS chooses an available port
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const info = server.address(); // { address, family, port }
      const close = () =>
        new Promise((res, rej) => {
          server.close((err) => (err ? rej(err) : res()));
        });

      resolve({
        server,
        address: info.address,
        port: info.port,
        family: info.family,
        close,
      });
    });
  });
}
