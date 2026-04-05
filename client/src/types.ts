// In dev the client is on 4002 and the server is on 4001; in prod nginx routes API paths
export const API =
  typeof window !== "undefined" && window.location.port === "4002"
    ? "http://localhost:4001"
    : "";

export type Message = { role: "user" | "assistant"; content: string };
export type SessionMeta = { id: string; title: string; agent_id: string; agent_name: string; created_at: number };
export type AgentMeta = { id: string; name: string; system_prompt: string; model: string };
export type ModelOption = { id: string; name: string };
