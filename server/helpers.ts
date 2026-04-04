export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
