FROM oven/bun:1

WORKDIR /app

# @github/copilot-sdk spawns a Node.js CLI subprocess that requires node:sqlite (Node.js 22.5+)
RUN apt-get update \
  && apt-get install -y curl ca-certificates \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN bun install --filter @copilot-apple/server

COPY server/ ./server/

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 4001

CMD ["bun", "index.ts"]
