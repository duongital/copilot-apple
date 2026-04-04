import "./db";
import { sessions } from "./copilot";
import { CORS_HEADERS, json, preflight } from "./helpers";
import { modelsRoutes } from "./routes/models";
import { agentByIdRoutes, agentsRoutes } from "./routes/agents";
import { sessionByIdRoutes, sessionChatRoutes, sessionMessagesRoutes, sessionsRoutes } from "./routes/sessions";

Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 4001,

  fetch(req) {
    if (req.method === "OPTIONS") return preflight();
    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  },

  routes: {
    "/models": modelsRoutes,
    "/agents": agentsRoutes,
    "/agents/:id": agentByIdRoutes,
    "/sessions": sessionsRoutes,
    "/sessions/:id/messages": sessionMessagesRoutes,
    "/sessions/:id/chat": sessionChatRoutes,
    "/sessions/:id": sessionByIdRoutes,
    "/health": {
      GET: () => json({ status: "ok", sessions: sessions.size }),
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`[server] Listening on http://localhost:${process.env.PORT ?? 4001}`);
