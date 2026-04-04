import type { AgentMeta, ModelOption } from "../types";

type AgentCardProps = {
  agent: AgentMeta;
  models: ModelOption[];
  onEdit: (agent: AgentMeta) => void;
  onDelete: (id: string) => void;
};

export function AgentCard({ agent, models, onEdit, onDelete }: AgentCardProps) {
  const modelLabel = (id: string) => models.find((m) => m.id === id)?.name ?? id;

  return (
    <div className="agent-card">
      <div className="agent-card-body">
        <div className="agent-card-header">
          <span className="agent-card-name">{agent.name}</span>
          <span className="agent-card-model">{modelLabel(agent.model)}</span>
        </div>
        {agent.system_prompt ? (
          <span className="agent-card-prompt">{agent.system_prompt}</span>
        ) : (
          <span className="agent-card-prompt muted">No system prompt</span>
        )}
      </div>
      <div className="agent-card-actions">
        <button className="btn btn-sm" onClick={() => onEdit(agent)}>Edit</button>
        {agent.id !== "general" && (
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(agent.id)}>Delete</button>
        )}
      </div>
    </div>
  );
}
