export const API = "";

export type Message = { role: "user" | "assistant"; content: string };
export type SessionMeta = { id: string; title: string; agent_id: string; agent_name: string; created_at: number };
export type AgentMeta = { id: string; name: string; system_prompt: string; model: string };
export type ModelOption = { id: string; name: string };
