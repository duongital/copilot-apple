import type { HttpMethod } from "../data/apiSpec";
import { METHOD_COLOR } from "../data/apiSpec";

export function MethodBadge({ method }: { method: HttpMethod }) {
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
