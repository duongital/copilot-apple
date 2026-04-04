FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock tsconfig.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN bun install --frozen-lockfile

# Copy client source and build static files
COPY client/ client/
RUN bun build client/index.html --outdir client/dist

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4000
CMD ["nginx", "-g", "daemon off;"]
