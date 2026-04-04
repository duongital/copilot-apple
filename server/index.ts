import { approveAll, CopilotClient, type CopilotSession } from "@github/copilot-sdk";
import { Database } from "bun:sqlite";

// ── Database ────────────────────────────────────────────────────────────────
const db = new Database("sessions.db", { create: true });

db.run(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'gpt-4.1',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New conversation',
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
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

// Add agent_id column to existing sessions table if it doesn't exist yet (migration)
try { db.run("ALTER TABLE sessions ADD COLUMN agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE"); } catch {}
// Add model column to existing agents table if it doesn't exist yet (migration)
try { db.run("ALTER TABLE agents ADD COLUMN model TEXT NOT NULL DEFAULT 'gpt-4.1'"); } catch {}

// Seed default "General" agent
db.run(`INSERT OR IGNORE INTO agents (id, name, system_prompt, model) VALUES ('general', 'General', '', 'gpt-4.1')`);

// Migrate existing sessions with no agent_id to the General agent
db.run(`UPDATE sessions SET agent_id = 'general' WHERE agent_id IS NULL`);

// ── Prepared statements ──────────────────────────────────────────────────────
const insertSession = db.prepare("INSERT OR IGNORE INTO sessions (id, agent_id) VALUES (?, ?)");
const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
const insertMessage = db.prepare(
  "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)"
);
const updateTitle = db.prepare("UPDATE sessions SET title = ? WHERE id = ?");
const queryAllSessions = db.prepare(`
  SELECT s.id, s.title, s.agent_id, s.created_at, a.name AS agent_name
  FROM sessions s
  LEFT JOIN agents a ON s.agent_id = a.id
  ORDER BY s.created_at DESC
`);
const queryMessages = db.prepare(
  "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC"
);
const queryAgentById = db.prepare("SELECT id, name, system_prompt, model FROM agents WHERE id = ?");
const queryAllAgents = db.prepare("SELECT id, name, system_prompt, model, created_at FROM agents ORDER BY created_at ASC");
const insertAgent = db.prepare("INSERT INTO agents (id, name, system_prompt, model) VALUES (?, ?, ?, ?)");
const updateAgent = db.prepare("UPDATE agents SET name = ?, system_prompt = ?, model = ? WHERE id = ?");
const deleteAgent = db.prepare("DELETE FROM agents WHERE id = ?");

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
const storedSessions = (queryAllSessions.all() as { id: string; agent_id: string }[]);
for (const { id, agent_id } of storedSessions) {
  try {
    const agent = queryAgentById.get(agent_id) as { system_prompt: string; model: string } | null;
    const systemPrompt = agent?.system_prompt ?? "";
    const model = agent?.model || "gpt-4.1";
    const session = await client.resumeSession(id, {
      onPermissionRequest: approveAll,
      model,
      ...(systemPrompt ? { systemMessage: { mode: "append" as const, content: systemPrompt } } : {}),
    });
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
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Server ───────────────────────────────────────────────────────────────────
Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 4001,

  fetch(req) {
    if (req.method === "OPTIONS") return preflight();
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  },

  routes: {
    // ── Models ───────────────────────────────────────────────────────────────
    "/models": {
      GET: async () => {
        try {
          const models = await client.listModels();
          const available = models
            .filter((m) => !m.policy || m.policy.state === "enabled")
            .map((m) => ({ id: m.id, name: m.name }));
          return json(available);
        } catch (err) {
          return json({ error: String(err) }, 500);
        }
      },
      OPTIONS: preflight,
    },

    // ── Agents ──────────────────────────────────────────────────────────────
    "/agents": {
      GET: () => json(queryAllAgents.all()),

      POST: async (req) => {
        let body: { name?: string; system_prompt?: string; model?: string };
        try { body = (await req.json()) as typeof body; } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        if (!body.name?.trim()) return json({ error: "Missing 'name' field" }, 400);
        const id = randomId();
        const model = body.model?.trim() || "gpt-4.1";
        insertAgent.run(id, body.name.trim(), body.system_prompt?.trim() ?? "", model);
        return json({ id, name: body.name.trim(), system_prompt: body.system_prompt ?? "", model }, 201);
      },

      OPTIONS: preflight,
    },

    "/agents/:id": {
      PUT: async (req) => {
        let body: { name?: string; system_prompt?: string; model?: string };
        try { body = (await req.json()) as typeof body; } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const existing = queryAgentById.get(req.params.id) as { id: string; name: string; system_prompt: string; model: string } | null;
        if (!existing) return json({ error: "Agent not found" }, 404);
        const name = body.name?.trim() ?? existing.name;
        const system_prompt = body.system_prompt !== undefined ? body.system_prompt.trim() : existing.system_prompt;
        const model = body.model?.trim() || existing.model;
        updateAgent.run(name, system_prompt, model, req.params.id);
        return json({ id: req.params.id, name, system_prompt, model });
      },

      DELETE: (req) => {
        const existing = queryAgentById.get(req.params.id) as { id: string } | null;
        if (!existing) return json({ error: "Agent not found" }, 404);
        // Abort in-memory sessions belonging to this agent before cascade delete
        const agentSessions = (db.prepare("SELECT id FROM sessions WHERE agent_id = ?").all(req.params.id) as { id: string }[]);
        for (const { id } of agentSessions) {
          const s = sessions.get(id);
          if (s) { s.abort().catch(() => {}); sessions.delete(id); }
        }
        deleteAgent.run(req.params.id);
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      },

      OPTIONS: preflight,
    },

    // ── Sessions ─────────────────────────────────────────────────────────────
    "/sessions": {
      GET: () => json(queryAllSessions.all()),

      POST: async (req) => {
        let body: { agentId?: string };
        try { body = (await req.json()) as typeof body; } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const agentId = body.agentId ?? "general";
        const agent = queryAgentById.get(agentId) as { id: string; name: string; system_prompt: string; model: string } | null;
        if (!agent) return json({ error: "Agent not found" }, 404);

        try {
          const session = await client.createSession({
            model: agent.model,
            onPermissionRequest: approveAll,
            ...(agent.system_prompt ? { systemMessage: { mode: "append" as const, content: agent.system_prompt } } : {}),
          });

          insertSession.run(session.sessionId, agentId);
          sessions.set(session.sessionId, session);
          return json({ sessionId: session.sessionId, title: "New conversation", agentId, agentName: agent.name }, 201);
        } catch (err) {
          return json({ error: String(err) }, 500);
        }
      },

      OPTIONS: preflight,
    },

    "/sessions/:id/messages": {
      GET: (req) => json(queryMessages.all(req.params.id)),
      OPTIONS: preflight,
    },

    "/sessions/:id/chat": {
      POST: async (req) => {
        const session = sessions.get(req.params.id);
        if (!session) return json({ error: "Session not found" }, 404);

        let body: { prompt?: string };
        try { body = (await req.json()) as typeof body; } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        if (!body.prompt) return json({ error: "Missing 'prompt' field" }, 400);

        try {
          insertMessage.run(req.params.id, "user", body.prompt);

          const msgCount = (queryMessages.all(req.params.id) as unknown[]).length;
          if (msgCount === 1) {
            updateTitle.run(body.prompt.slice(0, 60), req.params.id);
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

    "/health": {
      GET: () => json({ status: "ok", sessions: sessions.size }),
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`[server] Listening on http://localhost:${process.env.PORT ?? 4001}`);
