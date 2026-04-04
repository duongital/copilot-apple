import { useRef, useEffect } from "react";
import type { Message, SessionMeta } from "../types";

type ChatMessagesProps = {
  activeId: string | null;
  activeMeta: SessionMeta | null;
  messages: Message[];
  loading: boolean;
};

export function ChatMessages({ activeId, activeMeta, messages, loading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
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
  );
}
