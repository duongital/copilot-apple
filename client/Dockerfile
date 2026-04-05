FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN bun install --filter @copilot-apple/client

COPY client/ ./client/

WORKDIR /app/client

ENV NODE_ENV=production

EXPOSE 4002

CMD ["bun", "index.ts"]
