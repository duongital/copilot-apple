import index from "./index.html";

Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 4002,
  routes: {
    "/": index,
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
  development: process.env.NODE_ENV !== "production",
});

console.log(`[client] Listening on http://localhost:${process.env.PORT ?? 4002}`);
