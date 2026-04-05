import { Database } from "bun:sqlite";

export const db = new Database(process.env.DB_PATH ?? "sessions.db", { create: true });

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

// Migrations
try { db.run("ALTER TABLE sessions ADD COLUMN agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE"); } catch {}
try { db.run("ALTER TABLE agents ADD COLUMN model TEXT NOT NULL DEFAULT 'gpt-4.1'"); } catch {}

// Seed default agent
db.run(`INSERT OR IGNORE INTO agents (id, name, system_prompt, model) VALUES ('general', 'General', '', 'gpt-4.1')`);

// Migrate sessions with no agent_id
db.run(`UPDATE sessions SET agent_id = 'general' WHERE agent_id IS NULL`);

// ── Prepared statements ──────────────────────────────────────────────────────
export const insertSession = db.prepare("INSERT OR IGNORE INTO sessions (id, agent_id) VALUES (?, ?)");
export const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
export const insertMessage = db.prepare(
  "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)"
);
export const updateTitle = db.prepare("UPDATE sessions SET title = ? WHERE id = ?");
export const queryAllSessions = db.prepare(`
  SELECT s.id, s.title, s.agent_id, s.created_at, a.name AS agent_name
  FROM sessions s
  LEFT JOIN agents a ON s.agent_id = a.id
  ORDER BY s.created_at DESC
`);
export const queryMessages = db.prepare(
  "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC"
);
export const queryAgentById = db.prepare("SELECT id, name, system_prompt, model FROM agents WHERE id = ?");
export const queryAllAgents = db.prepare("SELECT id, name, system_prompt, model, created_at FROM agents ORDER BY created_at ASC");
export const insertAgent = db.prepare("INSERT INTO agents (id, name, system_prompt, model) VALUES (?, ?, ?, ?)");
export const updateAgent = db.prepare("UPDATE agents SET name = ?, system_prompt = ?, model = ? WHERE id = ?");
export const deleteAgent = db.prepare("DELETE FROM agents WHERE id = ?");
