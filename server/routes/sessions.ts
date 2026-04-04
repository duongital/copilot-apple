import { approveAll } from "@github/copilot-sdk";
import { client, sessions } from "../copilot";
import { deleteSession, insertMessage, insertSession, queryAgentById, queryAllSessions, queryMessages, updateTitle } from "../db";
import { CORS_HEADERS, json, preflight } from "../helpers";

export const sessionsRoutes = {
  GET: () => json(queryAllSessions.all()),

  POST: async (req: Request) => {
    let body: { agentId?: string };
    try { body = (await req.json()) as typeof body; } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const agentId = body.agentId ?? "general";
    const agent = queryAgentById.get(agentId) as { id: string; name: string; system_prompt: string; model: string } | null;
    if (!agent) return json({ error: "Agent not found" }, 404);

    try {
      const session = await client.createSession({
        model: agent.model,
        onPermissionRequest: approveAll,
        ...(agent.system_prompt ? { systemMessage: { mode: "append" as const, content: agent.system_prompt } } : {}),
      });
      insertSession.run(session.sessionId, agentId);
      sessions.set(session.sessionId, session);
      return json({ sessionId: session.sessionId, title: "New conversation", agentId, agentName: agent.name }, 201);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },

  OPTIONS: preflight,
};

export const sessionMessagesRoutes = {
  GET: (req: Request & { params: { id: string } }) => json(queryMessages.all(req.params.id)),
  OPTIONS: preflight,
};

export const sessionChatRoutes = {
  POST: async (req: Request & { params: { id: string } }) => {
    const session = sessions.get(req.params.id);
    if (!session) return json({ error: "Session not found" }, 404);

    let body: { prompt?: string };
    try { body = (await req.json()) as typeof body; } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (!body.prompt) return json({ error: "Missing 'prompt' field" }, 400);

    try {
      insertMessage.run(req.params.id, "user", body.prompt);

      const msgCount = (queryMessages.all(req.params.id) as unknown[]).length;
      if (msgCount === 1) {
        updateTitle.run(body.prompt.slice(0, 60), req.params.id);
      }

      const response = await session.sendAndWait({ prompt: body.prompt });
      const content = response?.data.content ?? "";
      insertMessage.run(req.params.id, "assistant", content);
      return json({ content });
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },
  OPTIONS: preflight,
};

export const sessionByIdRoutes = {
  DELETE: async (req: Request & { params: { id: string } }) => {
    const session = sessions.get(req.params.id);
    if (!session) return json({ error: "Session not found" }, 404);
    await session.abort();
    sessions.delete(req.params.id);
    deleteSession.run(req.params.id);
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  },
  OPTIONS: preflight,
};
