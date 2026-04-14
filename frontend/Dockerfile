# ───────────────────────────────────────────────────────────────
# Stage 1: deps — node_modules 설치
# ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci   # devDependencies도 build에 필요

# ───────────────────────────────────────────────────────────────
# Stage 2: builder — Next.js 빌드
# BACKEND_URL은 Server Component에서 request time에 읽히므로
# 빌드 시점에 주입할 필요 없다 (NEXT_PUBLIC_* 변수가 없음).
# ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ───────────────────────────────────────────────────────────────
# Stage 3: runner — 최소 실행 이미지
# next.config.ts의 output: "standalone" 으로 생성된 파일만 사용
# ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone 서버 + static 에셋 복사
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 빌드가 생성한 경량 Node.js 서버
CMD ["node", "server.js"]
