import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { API_SPEC, BASE_URL } from "../data/apiSpec";
import { EndpointCard } from "../components/EndpointCard";

export function API() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(API_SPEC.map((g) => [g.name, true]))
  );

  const toggleGroup = (name: string) =>
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
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
        {API_SPEC.map((group) => (
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
                {group.endpoints.map((ep) => (
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
