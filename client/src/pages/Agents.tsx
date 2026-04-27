import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../types";
import type { AgentMeta, ModelOption } from "../types";
import { AgentForm } from "../components/AgentForm";
import { AgentCard } from "../components/AgentCard";

export function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
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
    setForm({ name: "", system_prompt: "", model: defaultModel });
    setCreating(true);
  }

  function cancelForm() { setCreating(false); }

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

  async function deleteAgent(id: string) {
    if (!confirm("Delete this agent and all its sessions?")) return;
    await fetch(`${API}/agents/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="agents-tab">
      <div className="agents-header">
        <h2 className="agents-title">Agents</h2>
        {!creating && (
          <button className="btn" onClick={startCreate}>+ New Agent</button>
        )}
      </div>

      {creating && (
        <AgentForm
          creating={true}
          form={form}
          models={models}
          editing={null}
          onSave={saveCreate}
          onCancel={cancelForm}
          onChange={setForm}
        />
      )}

      <div className="agent-list">
        {agents.length === 0 && !creating && (
          <p className="empty-sidebar">No agents yet. Create one to get started.</p>
        )}
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            models={models}
            onClick={() => navigate(`/agents/${a.id}`)}
            onDelete={deleteAgent}
          />
        ))}
      </div>
    </div>
  );
}
