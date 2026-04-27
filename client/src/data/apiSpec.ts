// ── Types ────────────────────────────────────────────────────
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ParamDef {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface Endpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  pathParams?: ParamDef[];
  queryParams?: ParamDef[];
  body?: Record<string, string>;
  response: string | Record<string, unknown> | unknown[];
}

export interface Group {
  name: string;
  endpoints: Endpoint[];
}

// ── Base URL ─────────────────────────────────────────────────
export const BASE_URL = "http://localhost:4001";

// ── Method badge colours ─────────────────────────────────────
export const METHOD_COLOR: Record<HttpMethod, { bg: string; text: string }> = {
  GET:    { bg: "#0f3d24", text: "#3fb950" },
  POST:   { bg: "#0c2d6b", text: "#58a6ff" },
  PUT:    { bg: "#3d2a00", text: "#d29922" },
  DELETE: { bg: "#3d0c0c", text: "#f85149" },
};

// ── Static API spec ──────────────────────────────────────────
export const API_SPEC: Group[] = [
  {
    name: "Health",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        summary: "Server health check",
        response: { status: "ok", sessions: 0 },
      },
    ],
  },
  {
    name: "Models",
    endpoints: [
      {
        method: "GET",
        path: "/models",
        summary: "List available AI models",
        description: "Returns models that are currently enabled by policy.",
        response: [{ id: "string", name: "string" }],
      },
    ],
  },
  {
    name: "Tools",
    endpoints: [
      {
        method: "GET",
        path: "/tools",
        summary: "List available tools",
        queryParams: [
          { name: "model", type: "string", required: false, description: "Filter tools by model" },
        ],
        response: [{ name: "string", description: "string", parameters: "object" }],
      },
    ],
  },
  {
    name: "Agents",
    endpoints: [
      {
        method: "GET",
        path: "/agents",
        summary: "List all agents",
        response: [{ id: "string", name: "string", system_prompt: "string", model: "string" }],
      },
      {
        method: "POST",
        path: "/agents",
        summary: "Create a new agent",
        body: {
          name: "string  (required)",
          system_prompt: "string",
          model: 'string  (default: "gpt-4.1")',
        },
        response: { id: "string", name: "string", system_prompt: "string", model: "string" },
      },
      {
        method: "GET",
        path: "/agents/:id",
        summary: "Get agent by ID",
        pathParams: [{ name: "id", type: "string", required: true, description: "Agent ID" }],
        response: { id: "string", name: "string", system_prompt: "string", model: "string" },
      },
      {
        method: "PUT",
        path: "/agents/:id",
        summary: "Update an existing agent",
        pathParams: [{ name: "id", type: "string", required: true, description: "Agent ID" }],
        body: {
          name: "string",
          system_prompt: "string",
          model: "string",
        },
        response: { id: "string", name: "string", system_prompt: "string", model: "string" },
      },
      {
        method: "DELETE",
        path: "/agents/:id",
        summary: "Delete an agent and its sessions",
        pathParams: [{ name: "id", type: "string", required: true, description: "Agent ID" }],
        response: "204 No Content",
      },
    ],
  },
  {
    name: "Sessions",
    endpoints: [
      {
        method: "GET",
        path: "/sessions",
        summary: "List all sessions",
        response: [{ sessionId: "string", title: "string", agentId: "string" }],
      },
      {
        method: "POST",
        path: "/sessions",
        summary: "Create a new chat session",
        body: { agentId: 'string  (default: "general")' },
        response: { sessionId: "string", title: "string", agentId: "string", agentName: "string" },
      },
      {
        method: "GET",
        path: "/sessions/:id/messages",
        summary: "Get all messages in a session",
        pathParams: [{ name: "id", type: "string", required: true, description: "Session ID" }],
        response: [{ id: "number", session_id: "string", role: "user | assistant", content: "string" }],
      },
      {
        method: "POST",
        path: "/sessions/:id/chat",
        summary: "Send a message — returns SSE stream",
        description:
          "Streams assistant responses as Server-Sent Events. Each event is a JSON payload.",
        pathParams: [{ name: "id", type: "string", required: true, description: "Session ID" }],
        body: { prompt: "string  (required)" },
        response: {
          "Content-Type": "text/event-stream",
          events: [
            "{ delta: string }           — partial content chunk",
            "{ done: true, content: string }  — final message",
            "{ error: string }           — error occurred",
          ],
        },
      },
      {
        method: "DELETE",
        path: "/sessions/:id",
        summary: "Delete a session",
        pathParams: [{ name: "id", type: "string", required: true, description: "Session ID" }],
        response: "204 No Content",
      },
    ],
  },
];
