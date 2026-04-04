type ChatInputBarProps = {
  activeId: string | null;
  loading: boolean;
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatInputBar({ activeId, loading, input, onChange, onSend }: ChatInputBarProps) {
  return (
    <footer className="input-bar">
      <input
        className="input"
        placeholder={activeId ? "Type a message…" : "Select a session first"}
        value={input}
        disabled={!activeId || loading}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
      />
      <button className="btn" onClick={onSend} disabled={!activeId || loading || !input.trim()}>
        Send
      </button>
    </footer>
  );
}
