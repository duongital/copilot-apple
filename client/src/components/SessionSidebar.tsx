import type { SessionMeta } from "../types";

type SessionSidebarProps = {
  sessions: SessionMeta[];
  activeId: string | null;
  open: boolean;
  onOpen: (session: SessionMeta) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onNew: () => void;
  onClose: () => void;
};

export function SessionSidebar({ sessions, activeId, open, onOpen, onDelete, onNew, onClose }: SessionSidebarProps) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="btn btn-new" onClick={onNew}>+ New session</button>
        <div className="session-list">
          {sessions.length === 0 && <p className="empty-sidebar">No sessions yet</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${activeId === s.id ? "active" : ""}`}
              onClick={() => onOpen(s)}
            >
              <div className="session-item-text">
                <span className="session-title">{s.title}</span>
                <span className="session-agent-tag">{s.agent_name}</span>
              </div>
              <button
                className="btn-delete"
                title="Delete"
                onClick={(e) => onDelete(s.id, e)}
              >✕</button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
