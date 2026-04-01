FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock tsconfig.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN bun install --frozen-lockfile

# Copy client source
COPY client/ client/

WORKDIR /app/client
EXPOSE 4000

CMD ["bun", "start"]
