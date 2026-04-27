import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { API } from "../types";
import type { AgentMeta, ModelOption } from "../types";
import { AgentForm } from "./AgentForm";

type ToolInfo = {
  name: string;
  namespacedName?: string;
  description: string;
  parameters?: Record<string, unknown>;
  instructions?: string;
};

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", system_prompt: "", model: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [agentRes, modelsRes] = await Promise.all([
      fetch(`${API}/agents/${id}`),
      fetch(`${API}/models`),
    ]);
    if (!agentRes.ok) {
      setAgent(null);
      setLoading(false);
      return;
    }
    const agentData = await agentRes.json() as AgentMeta;
    const modelsData = await modelsRes.json() as ModelOption[] | { error: string };
    setAgent(agentData);
    setForm({ name: agentData.name, system_prompt: agentData.system_prompt, model: agentData.model });
    setModels(Array.isArray(modelsData) ? modelsData : []);
    setLoading(false);

    // Fetch tools (pass model so the list reflects model-specific overrides)
    setToolsLoading(true);
    try {
      const toolsRes = await fetch(`${API}/tools?model=${encodeURIComponent(agentData.model)}`);
      const toolsData = await toolsRes.json() as ToolInfo[] | { error: string };
      setTools(Array.isArray(toolsData) ? toolsData : []);
    } catch {
      setTools([]);
    } finally {
      setToolsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    if (!form.name.trim() || !agent) return;
    await fetch(`${API}/agents/${agent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    load();
  }

  async function deleteAgent() {
    if (!agent) return;
    if (!confirm("Delete this agent and all its sessions?")) return;
    await fetch(`${API}/agents/${agent.id}`, { method: "DELETE" });
    navigate("/agents");
  }

  const modelLabel = (modelId: string) => models.find((m) => m.id === modelId)?.name ?? modelId;

  if (loading) {
    return (
      <div className="agents-tab">
        <p className="empty-sidebar">Loading…</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="agents-tab">
        <p className="empty-sidebar">Agent not found.</p>
        <button className="btn" onClick={() => navigate("/agents")}>← Back to Agents</button>
      </div>
    );
  }

  return (
    <div className="agents-tab">
      <div className="agents-header">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/agents")}
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h2 className="agents-title" style={{ flex: 1 }}>{agent.name}</h2>
        {!editing && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit</button>
            {agent.id !== "general" && (
              <button className="btn btn-sm btn-danger" onClick={deleteAgent}>Delete</button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <AgentForm
          creating={false}
          form={form}
          models={models}
          editing={agent}
          onSave={saveEdit}
          onCancel={() => { setEditing(false); setForm({ name: agent.name, system_prompt: agent.system_prompt, model: agent.model }); }}
          onChange={setForm}
        />
      ) : (
        <div className="agent-detail">
          <div className="agent-detail-row">
            <span className="field-label">Model</span>
            <span className="agent-card-model">{modelLabel(agent.model)}</span>
          </div>
          <div className="agent-detail-row">
            <span className="field-label">System Prompt</span>
            {agent.system_prompt ? (
              <pre className="agent-detail-prompt">{agent.system_prompt}</pre>
            ) : (
              <span className="agent-card-prompt muted">No system prompt</span>
            )}
          </div>

          {/* ── Available Tools ── */}
          <div className="agent-detail-row">
            <span className="field-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Wrench size={14} /> Available Tools
              {!toolsLoading && (
                <span className="tools-count-badge">{tools.length}</span>
              )}
            </span>
            {toolsLoading ? (
              <span className="agent-card-prompt muted">Loading tools…</span>
            ) : tools.length === 0 ? (
              <span className="agent-card-prompt muted">No tools available</span>
            ) : (
              <div className="tools-list">
                {tools.map((tool) => (
                  <div key={tool.namespacedName ?? tool.name} className="tool-item">
                    <button
                      className="tool-item-header"
                      onClick={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
                    >
                      <span className="tool-item-name">{tool.namespacedName ?? tool.name}</span>
                      {expandedTool === tool.name
                        ? <ChevronDown size={13} />
                        : <ChevronRight size={13} />}
                    </button>
                    {expandedTool === tool.name && (
                      <div className="tool-item-body">
                        <p className="tool-item-desc">{tool.description}</p>
                        {tool.instructions && (
                          <p className="tool-item-instructions">{tool.instructions}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
