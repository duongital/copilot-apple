import type { AgentMeta } from "../types";

type AgentPickerModalProps = {
  agents: AgentMeta[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AgentPickerModal({ agents, selectedAgentId, onSelect, onConfirm, onCancel }: AgentPickerModalProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Choose an Agent</h3>
        <select
          className="input"
          value={selectedAgentId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <div className="form-actions">
          <button className="btn" onClick={onConfirm}>Start Chat</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
