import type { ParamDef } from "../data/apiSpec";

export function ParamsTable({ params, title }: { params: ParamDef[]; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "var(--text-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
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
            <code style={{ color: "var(--accent-hover)", fontFamily: "ui-monospace, monospace" }}>
              {p.name}
            </code>
            <span style={{
              color: "var(--text-subtle)",
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
            }}>
              {p.type}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {p.description}
              {p.required && (
                <span style={{ color: "#f85149", marginLeft: 4, fontSize: "0.7rem", fontWeight: 600 }}>
                  required
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
