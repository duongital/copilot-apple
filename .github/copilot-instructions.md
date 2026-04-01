# Copilot Instructions

## Build & Run

This is a **Bun** project (not Node.js). Use `bun` for all commands.

```bash
bun install              # install dependencies (workspace root)
bun run dev              # start both server and client (hot-reload)
bun run dev:server       # server only — http://localhost:4001
bun run dev:client       # client only — http://localhost:4000
```

There are no tests or linters configured.

## Architecture

Bun monorepo with two workspaces:

- **`server/`** — REST API (`Bun.serve`) that manages a single long-lived `CopilotClient` subprocess. All chat sessions share this one subprocess via JSON-RPC over stdio. Sessions and messages are persisted to SQLite (`sessions.db` via `bun:sqlite`). On boot, all persisted sessions are resumed automatically.
- **`client/`** — Bun static file server that serves a React 19 SPA. Bun bundles `.tsx` files directly — no separate build step.

Data flow: `Browser → REST API (server/) → CopilotClient subprocess → GitHub Copilot API`

## Key Conventions

- **Bun APIs over Node.js** — use `Bun.serve()`, `bun:sqlite`, and Bun-native patterns. No Express, no `node:http`.
- **Route-based API** — server endpoints are declared in the `routes: {}` object of `Bun.serve()`, not middleware chains.
- **Prepared statements** — all SQLite queries use `db.prepare()` at module level, not inline SQL strings.
- **CORS** — manual `CORS_HEADERS` object applied to every response and preflight handler. No CORS library.
- **Single entry files** — each workspace has one `index.ts` entry point. Server logic, DB schema, and API routes all live in `server/index.ts`.
- **Hot reload** — dev scripts use `bun --hot` for live reloading.
- **TypeScript strict mode** — `strict: true` with `noUncheckedIndexedAccess` and `noImplicitOverride` enabled.
- **API URL** — the client hardcodes `http://localhost:4001` as the API base in `client/src/App.tsx`.

## Environment

The server requires a `GITHUB_TOKEN` env var. Set it in `server/.env` (gitignored). The Docker setup passes it via `docker-compose.yml`.

## Docker

Both workspaces have Dockerfiles. The server Dockerfile installs Node.js alongside Bun because `@github/copilot-sdk` spawns a Node.js CLI subprocess.

```bash
docker compose up        # run both services in production mode
```
