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

    // Add an empty assistant message placeholder that we'll stream into
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/sessions/${activeId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: { delta?: string; done?: boolean; content?: string; error?: string };
          try { event = JSON.parse(jsonStr); } catch { continue; }

          if (event.delta !== undefined) {
            // Append delta to the last (assistant) message
            setMessages((m) => {
              const updated = [...m];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + event.delta,
              };
              return updated;
            });
          } else if (event.done) {
            // Replace with authoritative full content from server
            setMessages((m) => {
              const updated = [...m];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: event.content ?? updated[updated.length - 1].content,
              };
              return updated;
            });
            loadSessions();
          } else if (event.error) {
            setMessages((m) => {
              const updated = [...m];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${event.error}` };
              return updated;
            });
          }
        }
      }
    } catch (e) {
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${e}` };
        return updated;
      });
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
