import { useState, useCallback, useEffect } from "react";
import { API } from "../types";
import type { AgentMeta, ModelOption } from "../types";
import { AgentForm } from "./AgentForm";
import { AgentCard } from "./AgentCard";

export function AgentsTab() {
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [editing, setEditing] = useState<AgentMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", system_prompt: "", model: "gpt-4.1" });

  const load = useCallback(async () => {
    const [agentsRes, modelsRes] = await Promise.all([
      fetch(`${API}/agents`),
      fetch(`${API}/models`),
    ]);
    const agentsData = await agentsRes.json() as AgentMeta[];
    const modelsData = await modelsRes.json() as ModelOption[] | { error: string };
    setAgents(agentsData);
    setModels(Array.isArray(modelsData) ? modelsData : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const defaultModel = models[0]?.id ?? "gpt-4.1";

  function startCreate() {
    setEditing(null);
    setForm({ name: "", system_prompt: "", model: defaultModel });
    setCreating(true);
  }

  function startEdit(agent: AgentMeta) {
    setCreating(false);
    setForm({ name: agent.name, system_prompt: agent.system_prompt, model: agent.model });
    setEditing(agent);
  }

  function cancelForm() { setCreating(false); setEditing(null); }

  async function saveCreate() {
    if (!form.name.trim()) return;
    await fetch(`${API}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    cancelForm();
    load();
  }

  async function saveEdit() {
    if (!editing || !form.name.trim()) return;
    await fetch(`${API}/agents/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    cancelForm();
    load();
  }

  async function deleteAgent(id: string) {
    if (!confirm("Delete this agent and all its sessions?")) return;
    await fetch(`${API}/agents/${id}`, { method: "DELETE" });
    load();
  }

  const showForm = creating || editing !== null;

  return (
    <div className="agents-tab">
      <div className="agents-header">
        <h2 className="agents-title">Agents</h2>
        {!showForm && (
          <button className="btn" onClick={startCreate}>+ New Agent</button>
        )}
      </div>

      {showForm && (
        <AgentForm
          creating={creating}
          form={form}
          models={models}
          editing={editing}
          onSave={creating ? saveCreate : saveEdit}
          onCancel={cancelForm}
          onChange={setForm}
        />
      )}

      <div className="agent-list">
        {agents.length === 0 && !showForm && (
          <p className="empty-sidebar">No agents yet. Create one to get started.</p>
        )}
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} models={models} onEdit={startEdit} onDelete={deleteAgent} />
        ))}
      </div>
    </div>
  );
}
