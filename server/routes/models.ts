import { client } from "../copilot";
import { json, preflight } from "../helpers";

export const modelsRoutes = {
  GET: async () => {
    try {
      const models = await client.listModels();
      const available = models
        .filter((m) => !m.policy || m.policy.state === "enabled")
        .map((m) => ({ id: m.id, name: m.name }));
      return json(available);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },
  OPTIONS: preflight,
};
