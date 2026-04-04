import { useState, useRef, useEffect, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

const API = "http://localhost:4001";

type Message = { role: "user" | "assistant"; content: string };
type SessionMeta = { id: string; title: string; agent_id: string; agent_name: string; created_at: number };
type AgentMeta = { id: string; name: string; system_prompt: string; model: string };
type ModelOption = { id: string; name: string };

// ── Agents Tab ───────────────────────────────────────────────────────────────
function AgentsTab() {
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [editing, setEditing] = useState<AgentMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", system_prompt: "", model: "gpt-4.1" });

  const load = useCallback(async () => {
    const [agentsRes, modelsRes] = await Promise.all([
      fetch(`${API}/agents`),
      fetch(`${API}/models`),
    ]);
    const agentsData = await agentsRes.json() as AgentMeta[];
    const modelsData = await modelsRes.json() as ModelOption[] | { error: string };
    setAgents(agentsData);
    setModels(Array.isArray(modelsData) ? modelsData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const defaultModel = models[0]?.id ?? "gpt-4.1";

  function startCreate() {
    setEditing(null);
    setForm({ name: "", system_prompt: "", model: defaultModel });
    setCreating(true);
  }

  function startEdit(agent: AgentMeta) {
    setCreating(false);
    setForm({ name: agent.name, system_prompt: agent.system_prompt, model: agent.model });
    setEditing(agent);
  }

  function cancelForm() { setCreating(false); setEditing(null); }

  async function saveCreate() {
    if (!form.name.trim()) return;
    await fetch(`${API}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    cancelForm();
    load();
  }

  async function saveEdit() {
    if (!editing || !form.name.trim()) return;
    await fetch(`${API}/agents/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    cancelForm();
    load();
  }

  async function deleteAgent(id: string) {
    if (!confirm("Delete this agent and all its sessions?")) return;
    await fetch(`${API}/agents/${id}`, { method: "DELETE" });
    load();
  }

  const showForm = creating || editing !== null;

  const modelLabel = (id: string) => models.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="agents-tab">
      <div className="agents-header">
        <h2 className="agents-title">Agents</h2>
        {!showForm && (
          <button className="btn" onClick={startCreate}>+ New Agent</button>
        )}
      </div>

      {showForm && (
        <div className="agent-form">
          <h3 className="agent-form-title">{creating ? "New Agent" : "Edit Agent"}</h3>
          <label className="field-label">Name</label>
          <input
            className="input"
            placeholder="Agent name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <label className="field-label">Model</label>
          <select
            className="input"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          >
            {models.length === 0 && (
              <option value={form.model}>{form.model}</option>
            )}
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <label className="field-label">System Prompt</label>
          <textarea
            className="textarea"
            placeholder="Describe this agent's behaviour…"
            value={form.system_prompt}
            rows={6}
            onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
          />
          <div className="form-actions">
            <button className="btn" onClick={creating ? saveCreate : saveEdit}>Save</button>
            <button className="btn btn-ghost" onClick={cancelForm}>Cancel</button>
          </div>
        </div>
      )}

      <div className="agent-list">
        {agents.length === 0 && !showForm && (
          <p className="empty-sidebar">No agents yet. Create one to get started.</p>
        )}
        {agents.map((a) => (
          <div key={a.id} className="agent-card">
            <div className="agent-card-body">
              <div className="agent-card-header">
                <span className="agent-card-name">{a.name}</span>
                <span className="agent-card-model">{modelLabel(a.model)}</span>
              </div>
              {a.system_prompt ? (
                <span className="agent-card-prompt">{a.system_prompt}</span>
              ) : (
                <span className="agent-card-prompt muted">No system prompt</span>
              )}
            </div>
            <div className="agent-card-actions">
              <button className="btn btn-sm" onClick={() => startEdit(a)}>Edit</button>
              {a.id !== "general" && (
                <button className="btn btn-sm btn-danger" onClick={() => deleteAgent(a.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMeta, setActiveMeta] = useState<SessionMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [pickingAgent, setPickingAgent] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("general");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = useCallback(async () => {
    const res = await fetch(`${API}/sessions`);
    setSessions(await res.json() as SessionMeta[]);
  }, []);

  const loadAgents = useCallback(async () => {
    const res = await fetch(`${API}/agents`);
    setAgents(await res.json() as AgentMeta[]);
  }, []);

  useEffect(() => { loadSessions(); loadAgents(); }, [loadSessions, loadAgents]);

  async function openSession(s: SessionMeta) {
    setActiveId(s.id);
    setActiveMeta(s);
    setInput("");
    setSidebarOpen(false);
    const res = await fetch(`${API}/sessions/${s.id}/messages`);
    setMessages(await res.json() as Message[]);
  }

  async function newSession() {
    setSelectedAgentId(agents[0]?.id ?? "general");
    setPickingAgent(true);
  }

  async function confirmNewSession() {
    setPickingAgent(false);
    const res = await fetch(`${API}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: selectedAgentId }),
    });
    const data = await res.json() as { sessionId: string };
    await loadSessions();
    const allRes = await fetch(`${API}/sessions`);
    const all = await allRes.json() as SessionMeta[];
    const meta = all.find((s) => s.id === data.sessionId);
    if (meta) await openSession(meta);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`${API}/sessions/${id}`, { method: "DELETE" });
    if (activeId === id) { setActiveId(null); setActiveMeta(null); setMessages([]); }
    await loadSessions();
  }

  async function send() {
    if (!activeId || !input.trim() || loading) return;
    const prompt = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/sessions/${activeId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json() as { content?: string; error?: string };
      setMessages((m) => [...m, { role: "assistant", content: data.content ?? data.error ?? "" }]);
      loadSessions();
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {pickingAgent && (
        <div className="modal-backdrop" onClick={() => setPickingAgent(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Choose an Agent</h3>
            <select
              className="input"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <div className="form-actions">
              <button className="btn" onClick={confirmNewSession}>Start Chat</button>
              <button className="btn btn-ghost" onClick={() => setPickingAgent(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="btn btn-new" onClick={newSession}>+ New session</button>
        <div className="session-list">
          {sessions.length === 0 && <p className="empty-sidebar">No sessions yet</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${activeId === s.id ? "active" : ""}`}
              onClick={() => openSession(s)}
            >
              <div className="session-item-text">
                <span className="session-title">{s.title}</span>
                <span className="session-agent-tag">{s.agent_name}</span>
              </div>
              <button
                className="btn-delete"
                title="Delete"
                onClick={(e) => deleteSession(s.id, e)}
              >✕</button>
            </div>
          ))}
        </div>
      </aside>

      <div className="chat">
        {activeMeta && (
          <div className="chat-header">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="chat-agent-badge">{activeMeta.agent_name}</span>
            <span className="chat-header-title">{activeMeta.title}</span>
          </div>
        )}
        {!activeMeta && (
          <div className="chat-header">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          </div>
        )}
        <main className="messages">
          {!activeId && <div className="empty">Select a session or start a new one.</div>}
          {activeId && messages.length === 0 && !loading && (
            <div className="empty">Send a message to start chatting.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="bubble-label">{m.role === "user" ? "You" : (activeMeta?.agent_name ?? "Copilot")}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <span className="bubble-label">{activeMeta?.agent_name ?? "Copilot"}</span>
              <p className="typing">Thinking…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        <footer className="input-bar">
          {activeMeta && <span />}
          <input
            className="input"
            placeholder={activeId ? "Type a message…" : "Select a session first"}
            value={input}
            disabled={!activeId || loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn" onClick={send} disabled={!activeId || loading || !input.trim()}>
            Send
          </button>
        </footer>
      </div>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<"chat" | "agents">("chat");
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("theme") as "dark" | "light") ?? "dark"
  );

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <div className={`app-root${theme === "light" ? " light" : ""}`}>
      <nav className="top-nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${tab === "chat" ? "active" : ""}`}
            onClick={() => setTab("chat")}
          >Chat</button>
          <button
            className={`nav-tab ${tab === "agents" ? "active" : ""}`}
            onClick={() => setTab("agents")}
          >Agents</button>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>

      <div className={`layout${tab === "agents" ? " agents-mode" : ""}`}>
        {tab === "chat" ? <ChatTab /> : <AgentsTab />}
      </div>
    </div>
  );
}
