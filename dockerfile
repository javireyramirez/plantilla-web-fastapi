# --- ETAPA DE CONSTRUCCIÓN ---
FROM node:25.4.0-slim AS builder

# Instalamos pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .

# ✅ Agrega ambas variables
ARG VITE_BACK_URL
ARG VITE_CALLBACK_URL
ENV VITE_BACK_URL=$VITE_BACK_URL
ENV VITE_CALLBACK_URL=$VITE_CALLBACK_URL

RUN pnpm run build

# --- ETAPA DE PRODUCCIÓN ---
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]