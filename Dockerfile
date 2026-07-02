FROM node:22-alpine AS base
RUN apk add --no-cache fontconfig libc6-compat ttf-dejavu
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build-time-placeholder-change-runtime-secret-32chars
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next media && chown nextjs:nodejs .next media
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/scripts/wait-for-postgres.mjs ./scripts/wait-for-postgres.mjs
COPY docker-entrypoint.sh /docker-entrypoint.sh
USER root
RUN sed -i 's/\r$//' /docker-entrypoint.sh \
  && chmod +x /docker-entrypoint.sh \
  && chown nextjs:nodejs /docker-entrypoint.sh ./scripts/wait-for-postgres.mjs
USER nextjs

ENTRYPOINT ["/docker-entrypoint.sh"]
