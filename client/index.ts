import index from "./index.html";

Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 4002,
  routes: {
    "/": index,
  },
  fetch(req) {
    const url = new URL(req.url);
    // Asset requests (have a file extension) — don't hijack them
    if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      return new Response("Not Found", { status: 404 });
    }
    // SPA routes → return the same bundled HTML Bun already knows about
    return index;
  },
  development: process.env.NODE_ENV !== "production",
});

console.log(`[client] Listening on http://localhost:${process.env.PORT ?? 4002}`);
