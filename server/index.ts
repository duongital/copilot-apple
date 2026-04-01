import { approveAll, CopilotClient, type CopilotSession } from "@github/copilot-sdk";
import { Database } from "bun:sqlite";

// ── Database ────────────────────────────────────────────────────────────────
const db = new Database("sessions.db", { create: true });
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New conversation',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const insertSession = db.prepare("INSERT OR IGNORE INTO sessions (id) VALUES (?)");
const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
const insertMessage = db.prepare(
  "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)"
);
const updateTitle = db.prepare("UPDATE sessions SET title = ? WHERE id = ?");
const queryAllSessions = db.prepare(
  "SELECT id, title, created_at FROM sessions ORDER BY created_at DESC"
);
const queryMessages = db.prepare(
  "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC"
);

// ── Copilot client ───────────────────────────────────────────────────────────
const client = new CopilotClient({
  githubToken: process.env.GITHUB_TOKEN,
  useLoggedInUser: false,
});

await client.start();
console.log("[server] Copilot CLI subprocess ready");

// In-memory session store: sessionId → CopilotSession
const sessions = new Map<string, CopilotSession>();

// Resume all persisted sessions on boot
const storedSessions = queryAllSessions.all() as { id: string }[];
for (const { id } of storedSessions) {
  try {
    const session = await client.resumeSession(id, { onPermissionRequest: approveAll });
    sessions.set(session.sessionId, session);
    console.log(`[server] Resumed session ${session.sessionId}`);
  } catch (err) {
    console.warn(`[server] Could not resume session ${id}, removing:`, err);
    deleteSession.run(id);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

// ── Server ───────────────────────────────────────────────────────────────────
Bun.serve({
  port: process.env.PORT ? Number(process.env.PORT) : 4001,

  fetch(req) {
    if (req.method === "OPTIONS") return preflight();
  },

  routes: {
    // GET /sessions — list all persisted sessions
    "/sessions": {
      GET: () => json(queryAllSessions.all()),

      // POST /sessions — create a new session
      POST: async () => {
        try {
          const session = await client.createSession({
            model: "gpt-4.1",
            onPermissionRequest: approveAll,
          });
          insertSession.run(session.sessionId);
          sessions.set(session.sessionId, session);
          return json({ sessionId: session.sessionId, title: "New conversation" }, 201);
        } catch (err) {
          return json({ error: String(err) }, 500);
        }
      },

      OPTIONS: preflight,
    },

    // GET /sessions/:id/messages — full message history
    "/sessions/:id/messages": {
      GET: (req) => {
        const msgs = queryMessages.all(req.params.id);
        return json(msgs);
      },
      OPTIONS: preflight,
    },

    // POST /sessions/:id/chat — send a message
    "/sessions/:id/chat": {
      POST: async (req) => {
        const session = sessions.get(req.params.id);
        if (!session) return json({ error: "Session not found" }, 404);

        let body: { prompt?: string };
        try {
          body = await req.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        if (!body.prompt) return json({ error: "Missing 'prompt' field" }, 400);

        try {
          insertMessage.run(req.params.id, "user", body.prompt);

          // Use first user message as conversation title
          const msgCount = (
            queryMessages.all(req.params.id) as unknown[]
          ).length;
          if (msgCount === 1) {
            const title = body.prompt.slice(0, 60);
            updateTitle.run(title, req.params.id);
          }

          const response = await session.sendAndWait({ prompt: body.prompt });
          const content = response?.data.content ?? "";
          insertMessage.run(req.params.id, "assistant", content);
          return json({ content });
        } catch (err) {
          return json({ error: String(err) }, 500);
        }
      },
      OPTIONS: preflight,
    },

    // DELETE /sessions/:id — abort and remove session
    "/sessions/:id": {
      DELETE: async (req) => {
        const session = sessions.get(req.params.id);
        if (!session) return json({ error: "Session not found" }, 404);
        await session.abort();
        sessions.delete(req.params.id);
        deleteSession.run(req.params.id);
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      },
      OPTIONS: preflight,
    },

    // GET /health
    "/health": {
      GET: () => json({ status: "ok", sessions: sessions.size }),
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`[server] Listening on http://localhost:${process.env.PORT ?? 4001}`);

