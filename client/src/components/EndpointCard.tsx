import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Endpoint } from "../data/apiSpec";
import { METHOD_COLOR } from "../data/apiSpec";
import { MethodBadge } from "./MethodBadge";
import { JsonBlock } from "./JsonBlock";
import { ParamsTable } from "./ParamsTable";

export function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const hasDetails = ep.description || ep.pathParams || ep.queryParams || ep.body;

  return (
    <div
      style={{
        border: "1px solid var(--border-muted)",
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--bg-sidebar)",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = METHOD_COLOR[ep.method].text)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-muted)")}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
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
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Request Body{" "}
                <span style={{ fontWeight: 400, color: "var(--text-subtle)", textTransform: "none", letterSpacing: 0 }}>
                  application/json
                </span>
              </span>
              <JsonBlock value={ep.body} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              Response
            </span>
            <JsonBlock value={ep.response} />
          </div>
        </div>
      )}
    </div>
  );
}
