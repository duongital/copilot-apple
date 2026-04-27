import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ParamDef {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface Endpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  pathParams?: ParamDef[];
  queryParams?: ParamDef[];
  body?: Record<string, string>;
  response: string | Record<string, unknown> | unknown[];
}

interface Group {
  name: string;
  endpoints: Endpoint[];
}

// ── Static API spec ──────────────────────────────────────────
const BASE_URL = "http://localhost:4001";

const API_SPEC: Group[] = [
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

// ── Method badge config ──────────────────────────────────────
const METHOD_COLOR: Record<HttpMethod, { bg: string; text: string }> = {
  GET:    { bg: "#0f3d24", text: "#3fb950" },
  POST:   { bg: "#0c2d6b", text: "#58a6ff" },
  PUT:    { bg: "#3d2a00", text: "#d29922" },
  DELETE: { bg: "#3d0c0c", text: "#f85149" },
};

// ── Sub-components ───────────────────────────────────────────
function MethodBadge({ method }: { method: HttpMethod }) {
  const { bg, text } = METHOD_COLOR[method];
  return (
    <span style={{
      background: bg,
      color: text,
      fontFamily: "ui-monospace, monospace",
      fontSize: "0.7rem",
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 4,
      letterSpacing: "0.05em",
      minWidth: 54,
      textAlign: "center",
      display: "inline-block",
      flexShrink: 0,
    }}>
      {method}
    </span>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre style={{
      background: "var(--bg)",
      border: "1px solid var(--border-muted)",
      borderRadius: 6,
      padding: "10px 12px",
      fontSize: "0.78rem",
      color: "var(--text-muted)",
      overflowX: "auto",
      lineHeight: 1.6,
      margin: 0,
      fontFamily: "ui-monospace, 'SF Mono', monospace",
    }}>
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ParamsTable({ params, title }: { params: ParamDef[]; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </span>
      <div style={{ border: "1px solid var(--border-muted)", borderRadius: 6, overflow: "hidden" }}>
        {params.map((p, i) => (
          <div key={p.name} style={{
            display: "grid",
            gridTemplateColumns: "120px 80px 1fr",
            gap: "0 12px",
            padding: "7px 12px",
            fontSize: "0.8125rem",
            background: i % 2 === 0 ? "var(--bg)" : "var(--bg-surface)",
            alignItems: "center",
          }}>
            <code style={{ color: "var(--accent-hover)", fontFamily: "ui-monospace, monospace" }}>{p.name}</code>
            <span style={{ color: "var(--text-subtle)", fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>{p.type}</span>
            <span style={{ color: "var(--text-muted)" }}>
              {p.description}
              {p.required && (
                <span style={{ color: "#f85149", marginLeft: 4, fontSize: "0.7rem", fontWeight: 600 }}>required</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetails = ep.description || ep.pathParams || ep.queryParams || ep.body;

  return (
    <div style={{
      border: "1px solid var(--border-muted)",
      borderRadius: 8,
      overflow: "hidden",
      background: "var(--bg-sidebar)",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = METHOD_COLOR[ep.method].text)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-muted)")}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "10px 14px",
          textAlign: "left",
          color: "var(--text)",
          fontFamily: "inherit",
        }}
      >
        <MethodBadge method={ep.method} />
        <code style={{
          fontSize: "0.875rem",
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          color: "var(--text)",
          flex: 1,
        }}>
          {ep.path}
        </code>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", flex: 2 }}>
          {ep.summary}
        </span>
        <span style={{ color: "var(--text-subtle)", display: "flex", alignItems: "center" }}>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div style={{
          borderTop: "1px solid var(--border-muted)",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          {ep.description && (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              {ep.description}
            </p>
          )}

          {ep.pathParams && <ParamsTable params={ep.pathParams} title="Path Parameters" />}
          {ep.queryParams && <ParamsTable params={ep.queryParams} title="Query Parameters" />}

          {ep.body && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Request Body  <span style={{ fontWeight: 400, color: "var(--text-subtle)", textTransform: "none", letterSpacing: 0 }}>application/json</span>
              </span>
              <JsonBlock value={ep.body} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Response
            </span>
            <JsonBlock value={ep.response} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export function ApiPage() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(API_SPEC.map(g => [g.name, true]))
  );

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "28px 32px",
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Page header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            API Reference
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>Base URL</span>
            <code style={{
              fontSize: "0.8125rem",
              fontFamily: "ui-monospace, monospace",
              background: "var(--bg-surface)",
              padding: "2px 8px",
              borderRadius: 4,
              color: "var(--accent-hover)",
              border: "1px solid var(--border-muted)",
            }}>
              {BASE_URL}
            </code>
            <span style={{
              fontSize: "0.7rem",
              background: "#0f3d24",
              color: "#3fb950",
              padding: "1px 7px",
              borderRadius: 10,
              fontWeight: 600,
            }}>
              REST / SSE
            </span>
          </div>
        </div>

        {/* Groups */}
        {API_SPEC.map(group => (
          <section key={group.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Group heading */}
            <button
              onClick={() => toggleGroup(group.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                fontFamily: "inherit",
                color: "var(--text)",
              }}
            >
              {openGroups[group.name] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span style={{ fontSize: "1rem", fontWeight: 600 }}>{group.name}</span>
              <span style={{
                fontSize: "0.7rem",
                color: "var(--text-subtle)",
                background: "var(--bg-surface)",
                padding: "1px 7px",
                borderRadius: 10,
                fontWeight: 500,
              }}>
                {group.endpoints.length}
              </span>
            </button>

            {openGroups[group.name] && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.endpoints.map(ep => (
                  <EndpointCard key={`${ep.method}:${ep.path}`} ep={ep} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
