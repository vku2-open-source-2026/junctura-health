# SPDX-FileCopyrightText: 2026 Junctura Contributors
# SPDX-License-Identifier: Apache-2.0
# Build the portal from the repository root (the bundle aliases ../ui and ../contracts):
#   docker build -f portal/Dockerfile -t junctura-health-portal .
# Run it (see portal/compose.yaml): the container serves the static app and proxies
# /v1/*, /v2/* and /identity/* to the Junctura stack, so the browser only talks to
# one origin and no CORS is needed.

FROM node:24-alpine AS build
WORKDIR /app
COPY ui/package.json ui/package-lock.json ui/
COPY ui/src ui/src
COPY contracts/capabilities contracts/capabilities
COPY contracts/index.mjs contracts/index.d.ts contracts/package.json contracts/
COPY demo/plan.mjs demo/
COPY portal/package.json portal/package-lock.json portal/
COPY portal/ portal/
RUN npm --prefix ui ci --ignore-scripts \
 && npm --prefix portal ci --ignore-scripts \
 && npm --prefix portal run build

FROM caddy:2-alpine
COPY portal/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/portal/dist /srv/portal
