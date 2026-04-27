import { client } from "../copilot";
import { json, preflight } from "../helpers";

export const toolsRoutes = {
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const model = url.searchParams.get("model") ?? undefined;
      const result = await client.rpc.tools.list({ model });
      return json(result.tools);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },
  OPTIONS: preflight,
};
