import { sessions } from "../copilot";
import { db, deleteAgent, insertAgent, queryAgentById, queryAllAgents, updateAgent } from "../db";
import { CORS_HEADERS, json, preflight, randomId } from "../helpers";

export const agentsRoutes = {
  GET: () => json(queryAllAgents.all()),

  POST: async (req: Request) => {
    let body: { name?: string; system_prompt?: string; model?: string };
    try { body = (await req.json()) as typeof body; } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (!body.name?.trim()) return json({ error: "Missing 'name' field" }, 400);
    const id = randomId();
    const model = body.model?.trim() || "gpt-4.1";
    insertAgent.run(id, body.name.trim(), body.system_prompt?.trim() ?? "", model);
    return json({ id, name: body.name.trim(), system_prompt: body.system_prompt ?? "", model }, 201);
  },

  OPTIONS: preflight,
};

export const agentByIdRoutes = {
  GET: (req: Request & { params: { id: string } }) => {
    const agent = queryAgentById.get(req.params.id) as { id: string; name: string; system_prompt: string; model: string } | null;
    if (!agent) return json({ error: "Agent not found" }, 404);
    return json(agent);
  },

  PUT: async (req: Request & { params: { id: string } }) => {
    let body: { name?: string; system_prompt?: string; model?: string };
    try { body = (await req.json()) as typeof body; } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const existing = queryAgentById.get(req.params.id) as { id: string; name: string; system_prompt: string; model: string } | null;
    if (!existing) return json({ error: "Agent not found" }, 404);
    const name = body.name?.trim() ?? existing.name;
    const system_prompt = body.system_prompt !== undefined ? body.system_prompt.trim() : existing.system_prompt;
    const model = body.model?.trim() || existing.model;
    updateAgent.run(name, system_prompt, model, req.params.id);
    return json({ id: req.params.id, name, system_prompt, model });
  },

  DELETE: (req: Request & { params: { id: string } }) => {
    const existing = queryAgentById.get(req.params.id) as { id: string } | null;
    if (!existing) return json({ error: "Agent not found" }, 404);
    const agentSessions = db.prepare("SELECT id FROM sessions WHERE agent_id = ?").all(req.params.id) as { id: string }[];
    for (const { id } of agentSessions) {
      const s = sessions.get(id);
      if (s) { s.abort().catch(() => {}); sessions.delete(id); }
    }
    deleteAgent.run(req.params.id);
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  },

  OPTIONS: preflight,
};
