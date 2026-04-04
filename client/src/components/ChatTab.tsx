import { useState, useCallback, useEffect } from "react";
import { API } from "../types";
import type { Message, SessionMeta, AgentMeta } from "../types";
import { AgentPickerModal } from "./AgentPickerModal";
import { SessionSidebar } from "./SessionSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInputBar } from "./ChatInputBar";

export function ChatTab() {
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
        <AgentPickerModal
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
          onConfirm={confirmNewSession}
          onCancel={() => setPickingAgent(false)}
        />
      )}

      <SessionSidebar
        sessions={sessions}
        activeId={activeId}
        open={sidebarOpen}
        onOpen={openSession}
        onDelete={deleteSession}
        onNew={newSession}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="chat">
        <div className="chat-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          {activeMeta && (
            <>
              <span className="chat-agent-badge">{activeMeta.agent_name}</span>
              <span className="chat-header-title">{activeMeta.title}</span>
            </>
          )}
        </div>

        <ChatMessages
          activeId={activeId}
          activeMeta={activeMeta}
          messages={messages}
          loading={loading}
        />

        <ChatInputBar
          activeId={activeId}
          loading={loading}
          input={input}
          onChange={setInput}
          onSend={send}
        />
      </div>
    </>
  );
}
