# SPDX-FileCopyrightText: 2026 Junctura Contributors
# SPDX-License-Identifier: Apache-2.0
# Backend API of the portal, built from the repository root:
#   docker build -f portal/server/Dockerfile -t junctura-health-portal-api .
# It runs `main.mjs` as the non-root `node` user and reads the demo credentials
# from the environment (portal/compose.yaml feeds .junctura/demo/junctura-health-portal.env).
# The seed accounts are copied in so `staffFor` can map usernames to facilities.

FROM node:24-alpine
WORKDIR /app
COPY portal/server/package.json portal/server/package-lock.json portal/server/
COPY seed/data/accounts.json seed/data/
RUN npm --prefix portal/server ci --omit=dev --ignore-scripts
COPY portal/server/ portal/server/
USER node
CMD ["node", "portal/server/main.mjs"]
