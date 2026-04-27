import { approveAll, CopilotClient, type CopilotSession } from "@github/copilot-sdk";
import { deleteSession, queryAgentById, queryAllSessions } from "./db";

export const client = new CopilotClient({
  githubToken: process.env.GITHUB_TOKEN,
  useLoggedInUser: false,
});

await client.start();
console.log("[server] Copilot CLI subprocess ready");

export const sessions = new Map<string, CopilotSession>();

const storedSessions = queryAllSessions.all() as { id: string; agent_id: string }[];
for (const { id, agent_id } of storedSessions) {
  try {
    const agent = queryAgentById.get(agent_id) as { system_prompt: string; model: string } | null;
    const systemPrompt = agent?.system_prompt ?? "";
    const model = agent?.model || "gpt-4.1";
    const session = await client.resumeSession(id, {
      onPermissionRequest: approveAll,
      model,
      streaming: true,
      ...(systemPrompt ? { systemMessage: { mode: "append" as const, content: systemPrompt } } : {}),
    });
    sessions.set(session.sessionId, session);
    console.log(`[server] Resumed session ${session.sessionId}`);
  } catch (err) {
    console.warn(`[server] Could not resume session ${id}, removing:`, err);
    deleteSession.run(id);
  }
}
