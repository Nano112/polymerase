# Polymerase

A node-based Minecraft schematic execution engine built with the BHVR stack (Bun, Hono, Vite, React).

## Architecture

Polymerase is designed for **isomorphic execution** - the same code runs in both the browser and server:

```
┌──────────────────────────────────────────────────────────────┐
│                         Polymerase                            │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Client    │  │   Server    │  │   @polymerase/core  │  │
│  │  (React)    │  │   (Hono)    │  │    (Isomorphic)     │  │
│  │             │  │             │  │                     │  │
│  │ - React Flow│  │ - REST API  │  │ - SynthaseService   │  │
│  │ - Monaco    │  │ - SQLite    │  │ - PolymeraseEngine  │  │
│  │ - WebWorker │  │ - Worker    │  │ - Utilities         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

- **Nucleation** - WASM library for reading/writing Minecraft schematics
- **Synthase** - Sandboxed JavaScript execution engine
- **Polymerase Core** - Orchestrator for graph execution, events, and dependencies
- **React Flow** - Visual node-based editor
- **SQLite** - Storage for saved flows

## Workspace Structure

```
polymerase/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/    # Flow editor components
│   │   │   ├── nodes/     # Custom React Flow nodes
│   │   │   └── ui/        # Reusable UI components
│   │   ├── hooks/         # React hooks
│   │   └── store/         # Zustand state management
│   └── package.json
├── server/                 # Hono backend (Bun)
│   ├── src/
│   │   ├── db/            # SQLite schema & connection
│   │   └── routes/        # API endpoints
│   └── package.json
├── packages/
│   └── core/              # @polymerase/core - shared execution engine
│       ├── src/
│       │   ├── services/  # SynthaseService
│       │   ├── types/     # TypeScript definitions
│       │   ├── utils/     # Calculator, Noise, Vector, etc.
│       │   └── worker/    # WebWorker/Bun worker support
│       └── package.json
└── shared/                # Shared types between client/server
```

## Getting Started

### Prerequisites

- Bun v1.2+
- Node.js 18+ (for some tooling)

### Installation

```bash
# Clone the repository
git clone https://github.com/Nano112/polymerase.git
cd polymerase

# Install dependencies
bun install

# Build the core package first
bun run build:core
```

### Development

```bash
# Start all services (client + server + core watch)
bun run dev

# Or run individually:
bun run dev:client    # React frontend on http://localhost:5173
bun run dev:server    # Hono backend on http://localhost:3000
bun run dev:core      # Core package watch mode
```

### Production Build

```bash
bun run build
```

## Deployment

### Docker / Dokploy

The project includes a `docker-compose.yml` configuration for easy deployment.

```bash
docker compose up -d --build
```

This will start:
- **Client**: Served on port 80 (proxies API requests to server)
- **Server**: Backend API on port 3000 (internal)
- **Data**: Persisted in the `./data` volume

## API Endpoints

### Flows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flows` | List all flows |
| GET | `/api/flows/:id` | Get a single flow |
| POST | `/api/flows` | Create a new flow |
| PUT | `/api/flows/:id` | Update a flow |
| DELETE | `/api/flows/:id` | Delete a flow |

### Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/execute` | Execute a complete flow |
| POST | `/api/execute/script` | Execute a single script |
| POST | `/api/execute/validate` | Validate a script |
| GET | `/api/executions` | List execution history |
| GET | `/api/executions/:id` | Get execution details |

## Context Providers

Scripts have access to these utilities:

| Provider | Description |
|----------|-------------|
| `Schematic` | Create and manipulate Minecraft schematics |
| `Logger` | Log messages to the UI |
| `Progress` | Report execution progress |
| `Calculator` | Math utilities |
| `Noise` | Simplex noise generation |
| `Vec` / `Vec3` | Vector math |
| `Pathfinding` | A* pathfinding in schematics |
| `Easing` | Animation easing functions |
| `SchematicUtils` | Helper functions (fillBox, sphere, etc.) |

### Example Script

```javascript
// Input: width, height, depth
const schem = new Schematic();

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < depth; z++) {
      const noise = Noise.get3D_01(x, y, z, 0.1);
      if (noise > 0.5) {
        schem.set_block(x, y, z, 'minecraft:stone');
      }
    }
  }
  Progress.report((x / width) * 100, `Processing layer ${x}`);
}

export const output = schem;
```

## Configuration

### Environment Variables

```bash
# Client (.env)
VITE_SERVER_URL=http://localhost:3000

# Server (.env)
DATABASE_PATH=./data/polymerase.db
PORT=3000
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Synthase - Sandboxed JavaScript execution
- Nucleation - Minecraft schematic WASM library
- React Flow - Node-based UI
- BHVR - Bun + Hono + Vite + React stack
