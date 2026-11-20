# 构建 Nuxt 服务端产物，并提供 SQLite 原生模块的编译工具。
FROM node:24-bookworm AS build

WORKDIR /app

# npm ci 会运行 nuxt prepare，因此安装前需要完整项目源码。
COPY . .
RUN npm ci && npm run build

# 运行阶段与构建阶段使用相同的 Node.js 和系统版本。
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

WORKDIR /app

COPY --from=build /app/.output ./.output
RUN install -d -o node -g node /app/data

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
