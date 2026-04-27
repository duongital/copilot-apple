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
        streaming: true,
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

    const sessionId = req.params.id;
    const prompt = body.prompt;

    insertMessage.run(sessionId, "user", prompt);
    const msgCount = (queryMessages.all(sessionId) as unknown[]).length;
    if (msgCount === 1) {
      updateTitle.run(prompt.slice(0, 60), sessionId);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        let fullContent = "";

        const unsubscribe = session.on((event) => {
          if (event.type === "assistant.message_delta") {
            fullContent += event.data.deltaContent;
            send({ delta: event.data.deltaContent });
          } else if (event.type === "assistant.message") {
            // Capture final authoritative content for DB storage
            fullContent = event.data.content;
          } else if (event.type === "session.idle") {
            insertMessage.run(sessionId, "assistant", fullContent);
            send({ done: true, content: fullContent });
            controller.close();
            unsubscribe();
          } else if (event.type === "session.error") {
            send({ error: event.data.message });
            controller.close();
            unsubscribe();
          }
        });

        try {
          await session.send({ prompt });
        } catch (err) {
          send({ error: String(err) });
          controller.close();
          unsubscribe();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
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
