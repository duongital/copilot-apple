# copilot-apple

A self-hosted GitHub Copilot chat service with a persistent REST API backend and a React web client. One shared Copilot CLI subprocess handles all conversations, keeping RAM usage low.

## Architecture

```
Browser (localhost:4000)
        │  HTTP REST
        ▼
  Bun server — server/  (localhost:4001)
        │  JSON-RPC stdio
        ▼
  Copilot CLI subprocess  ← started once, shared forever
        │  HTTPS
        ▼
  GitHub Copilot API
```

## Project structure

```
copilot-apple/
├── package.json          # Bun workspace root
├── server/
│   ├── index.ts          # REST API + Copilot client
│   ├── sessions.db       # SQLite — persisted sessions & messages
│   └── .env              # GITHUB_TOKEN, PORT
└── client/
    ├── index.ts          # Bun static server
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx       # Chat UI with session sidebar
        └── index.css
```

## Getting started

### 1. Install dependencies

```bash
bun install
```

### 2. Set your GitHub token

Edit `server/.env`:

```env
GITHUB_TOKEN=your_token_here
PORT=4001
```

### 3. Run both server and client

```bash
bun run dev
```

Or run separately:

```bash
bun run dev:server   # API on http://localhost:4001
bun run dev:client   # UI  on http://localhost:4000
```

## Features

- **Persistent sessions** — conversations are saved to SQLite (`sessions.db`) and survive server restarts
- **Session resume** — on boot the server reconnects to all previous Copilot sessions via `resumeSession()`
- **Session history** — full message history per conversation, accessible via the sidebar
- **Auto title** — session title is set from the first message you send
- **Single subprocess** — one Copilot CLI process shared across all sessions; new sessions are lightweight RPC calls
- **CORS enabled** — client on a different port can freely call the API

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sessions` | List all sessions |
| `POST` | `/sessions` | Create a new session |
| `GET` | `/sessions/:id/messages` | Full message history for a session |
| `POST` | `/sessions/:id/chat` | `{ "prompt": "..." }` → `{ "content": "..." }` |
| `DELETE` | `/sessions/:id` | Abort and delete a session |
| `GET` | `/health` | Server status + active session count |

## Deployment (AWS EC2)

Recommended instance: **t3.large** (2 vCPU, 8 GB RAM).

The Copilot CLI subprocess uses ~500 MB at idle and up to ~1 GB during active sessions. A `t3.large` comfortably handles several concurrent conversations.

```bash
# On the server
bun run start:server
```

