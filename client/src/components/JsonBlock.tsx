export function JsonBlock({ value }: { value: unknown }) {
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
