import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:4001";

type Message = { role: "user" | "assistant"; content: string };
type SessionMeta = { id: string; title: string; created_at: number };

export default function App() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = useCallback(async () => {
    const res = await fetch(`${API}/sessions`);
    setSessions(await res.json());
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function openSession(id: string) {
    setActiveId(id);
    setInput("");
    setSidebarOpen(false);
    const res = await fetch(`${API}/sessions/${id}/messages`);
    setMessages(await res.json());
  }

  async function newSession() {
    const res = await fetch(`${API}/sessions`, { method: "POST" });
    const data = await res.json();
    await loadSessions();
    await openSession(data.sessionId);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`${API}/sessions/${id}`, { method: "DELETE" });
    if (activeId === id) { setActiveId(null); setMessages([]); }
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
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.content ?? data.error }]);
      // Refresh sidebar so title updates after first message
      loadSessions();
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      {/* Sidebar backdrop for mobile */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="btn btn-new" onClick={newSession}>+ New session</button>
        <div className="session-list">
          {sessions.length === 0 && <p className="empty-sidebar">No sessions yet</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${activeId === s.id ? "active" : ""}`}
              onClick={() => openSession(s.id)}
            >
              <span className="session-title">{s.title}</span>
              <button
                className="btn-delete"
                title="Delete"
                onClick={(e) => deleteSession(s.id, e)}
              >✕</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <div className="chat">
        <main className="messages">
          {!activeId && (
            <div className="empty">Select a session or start a new one.</div>
          )}
          {activeId && messages.length === 0 && !loading && (
            <div className="empty">Send a message to start chatting.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="bubble-label">{m.role === "user" ? "You" : "Copilot"}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <span className="bubble-label">Copilot</span>
              <p className="typing">Thinking…</p>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        <footer className="input-bar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
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
    </div>
  );
}
