# -----------------------------------------------------------
# Stage 1 : Dependencies
# -----------------------------------------------------------
FROM node:22-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# -----------------------------------------------------------
# Stage 2 : Build
# -----------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -----------------------------------------------------------
# Stage 3 : Production runner
# -----------------------------------------------------------
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Install yt-dlp + ffmpeg + python (required by yt-dlp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      ffmpeg \
      curl \
      ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Use default node user from the image
RUN mkdir -p /app/data /app/public/downloads && \
    chown -R node:node /app

# Copy standalone build output with proper ownership
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
