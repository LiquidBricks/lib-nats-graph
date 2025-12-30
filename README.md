# nats-graph

A Gremlin-compatible graph database, backed by NATS KV as the storage engine.

Composable graph traversal helpers built on top of NATS JetStream key-value buckets. The API mirrors a Gremlin-style fluent traversal so you can script graph mutations and queries against a NATS deployment.

## Installation

Until the package is published to the npm registry you can pull it straight from GitHub:

```sh
npm install git+https://github.com/<your-org>/<your-repo>.git
# Or add it to package.json
npm install --save git+https://github.com/<your-org>/<your-repo>.git
```

Replace `<your-org>/<your-repo>` with the GitHub location you push this project to.

## Usage

```js
import { graph, connection } from 'nats-graph';

// Ensure the NATS client connects before running traversals
await connection.client('nats://localhost:4222');

const g = graph();

// Create a vertex and attach a property
await g.addV('person').property('name', 'Alice').then();

// Query vertices by property
const people = await g.V().has('name', 'Alice').then();
console.log(people);
```

The package exposes:

- `graph()` – create a fluent traversal context.
- `V`, `E`, `addV`, `addE`, `drop` – low-level helpers for vertices and edges.
- `connection` – lazy NATS connection primitives.
- Property helpers from `property.js` and label helpers from `steps/label.js`.

See the `test/` directory for more end-to-end examples.

## Development

```sh
npm install
npm test
```

## Releasing

1. Create a new GitHub repository and push the contents of this directory.
2. Update the `repository`, `bugs`, `homepage`, `author`, and `license` fields in `package.json`.
3. Tag a version (`git tag v0.1.0`) so consumers pin to a specific release when installing via git URLs.

When you are ready to publish to the npm registry, run `npm publish` from this directory.
