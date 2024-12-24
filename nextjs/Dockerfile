FROM node:18-alpine AS builder

WORKDIR /app

# パッケージのインストールを先に行う
COPY package*.json ./
RUN npm clean-install

# ソースコードのコピーとビルド
COPY . .
#RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

# 必要なファイルのみをコピー
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]