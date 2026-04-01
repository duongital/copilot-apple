FROM oven/bun:1 AS base
WORKDIR /app

# Install Node.js (required by @github/copilot-sdk CLI subprocess)
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock tsconfig.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN bun install --frozen-lockfile

# Copy server source
COPY server/ server/

WORKDIR /app/server
EXPOSE 4001

CMD ["bun", "start"]
