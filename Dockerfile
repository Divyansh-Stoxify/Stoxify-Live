# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Set dummy key for build time (override .env.local)
ENV ECDSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMFICAQcwDTIBoSadfZ5EZJm/EXAMPLE\n-----END PRIVATE KEY-----"
ENV ECDSA_PRIVATE_KEY_PATH=""

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public keys
RUN echo "-----BEGIN PRIVATE KEY-----" > keys/ecdsa_private.pem && \
  echo "MFICAQcwDTIBoSadfZ5EZJm/EXAMPLE" >> keys/ecdsa_private.pem && \
  echo "-----END PRIVATE KEY-----" >> keys/ecdsa_private.pem
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Allow NODE_ENV to be overridden for development
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
