import index from "./index.html";

Bun.serve({
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  routes: {
    "/": index,
  },
  development: process.env.NODE_ENV !== "production",
});

console.log(`[client] Listening on http://localhost:${process.env.PORT ?? 4000}`);
