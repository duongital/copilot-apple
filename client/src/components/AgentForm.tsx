import type { AgentMeta, ModelOption } from "../types";

type AgentFormProps = {
  creating: boolean;
  form: { name: string; system_prompt: string; model: string };
  models: ModelOption[];
  editing: AgentMeta | null;
  onSave: () => void;
  onCancel: () => void;
  onChange: (form: { name: string; system_prompt: string; model: string }) => void;
};

export function AgentForm({ creating, form, models, onSave, onCancel, onChange }: AgentFormProps) {
  return (
    <div className="agent-form">
      <h3 className="agent-form-title">{creating ? "New Agent" : "Edit Agent"}</h3>
      <label className="field-label">Name</label>
      <input
        className="input"
        placeholder="Agent name"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
      />
      <label className="field-label">Model</label>
      <select
        className="input"
        value={form.model}
        onChange={(e) => onChange({ ...form, model: e.target.value })}
      >
        {models.length === 0 && <option value={form.model}>{form.model}</option>}
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <label className="field-label">System Prompt</label>
      <textarea
        className="textarea"
        placeholder="Describe this agent's behaviour…"
        value={form.system_prompt}
        rows={6}
        onChange={(e) => onChange({ ...form, system_prompt: e.target.value })}
      />
      <div className="form-actions">
        <button className="btn" onClick={onSave}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
