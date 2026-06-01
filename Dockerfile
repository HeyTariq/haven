FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data
RUN npm run build
# Precompile the migration entrypoint to plain JS so the runtime needs no tsx/esbuild.
# Bundle drizzle-orm in (Next's trace omits its migrator subpath); keep only the native
# better-sqlite3 external, which is present in the standalone node_modules.
RUN npx esbuild src/lib/db/migrate.ts \
    --bundle --platform=node --format=cjs --external:better-sqlite3 \
    --outfile=migrate.js
# Next traces sharp into the standalone server trace unconditionally; with image
# optimization disabled it is never invoked, so prune it (~17M of libvips binaries).
RUN rm -rf .next/standalone/node_modules/sharp .next/standalone/node_modules/@img

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/migrate.js ./migrate.js

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node migrate.js && node server.js"]
