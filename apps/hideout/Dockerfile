# Build context is the monorepo root, not this directory: the app compiles
# @workspace/ui from source, so the package has to be inside the context.
#
#   docker build -f apps/hideout/Dockerfile -t hideout .

FROM node:22-alpine AS deps
WORKDIR /repo
# Only the manifests, so a change to a source file does not invalidate the
# install layer.
COPY package.json package-lock.json ./
COPY apps/hideout/package.json apps/hideout/
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules node_modules
COPY --from=deps /repo/apps/hideout/node_modules apps/hideout/node_modules
COPY . .
WORKDIR /repo/apps/hideout
# Copies content images into public/ and builds the post search index; the
# build reads both.
RUN npm run sync:content-assets \
  && node scripts/generate-search-index.mjs \
  && npx next build --webpack

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runs unprivileged: this serves a public site and can write into content/.
RUN addgroup -S hideout && adduser -S hideout -G hideout

# The standalone bundle carries the server and only the modules it actually
# imports. Static assets and public/ are not traced into it and are copied
# alongside.
COPY --from=build --chown=hideout:hideout /repo/apps/hideout/.next/standalone ./
COPY --from=build --chown=hideout:hideout /repo/apps/hideout/.next/static ./apps/hideout/.next/static
COPY --from=build --chown=hideout:hideout /repo/apps/hideout/public ./apps/hideout/public
# The CMS reads and writes these at runtime, so they are real files rather
# than something baked into the build.
COPY --from=build --chown=hideout:hideout /repo/apps/hideout/content ./apps/hideout/content

USER hideout
EXPOSE 3000

# A container that answers nothing is a container CasaOS should restart.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "apps/hideout/server.js"]
