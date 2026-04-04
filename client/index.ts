import index from "./index.html";

const API_SERVER = process.env.API_SERVER ?? "http://localhost:4001";
const API_PATHS = ["/sessions", "/agents", "/models", "/health"];

Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  routes: {
    "/": index,
  },
  async fetch(req) {
    const url = new URL(req.url);

    // Reverse-proxy API requests to the backend server
    if (API_PATHS.some((p) => url.pathname.startsWith(p))) {
      const target = `${API_SERVER}${url.pathname}${url.search}`;
      const res = await fetch(target, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
  development: process.env.NODE_ENV !== "production",
});

console.log(`[client] Listening on http://localhost:${process.env.PORT ?? 4000}`);
console.log(`[client] Proxying API requests to ${API_SERVER}`);
