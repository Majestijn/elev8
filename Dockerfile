# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# 1. Frontend assets (Inertia + React → public/build)
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources resources
COPY vite.config.ts tailwind.config.js postcss.config.js tsconfig.json ./
RUN npm run build

# ─────────────────────────────────────────────────────────────
# 2. PHP dependencies (vendor/ met geoptimaliseerde autoloader)
# ─────────────────────────────────────────────────────────────
FROM composer:2 AS vendor
WORKDIR /app
COPY . .
RUN composer install \
    --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts

# ─────────────────────────────────────────────────────────────
# 3. Runtime (nginx + php-fpm, productie-grade, draait als www-data)
# ─────────────────────────────────────────────────────────────
FROM serversideup/php:8.4-fpm-nginx

USER root
WORKDIR /var/www/html

# Applicatiecode (vendor/node_modules uitgesloten via .dockerignore)
COPY --chown=www-data:www-data . .
# Composer-vendor uit stage 2 en gebouwde assets uit stage 1
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Migraties + config-cache bij elke deploy (Railway injecteert env at runtime)
COPY --chown=www-data:www-data docker/entrypoint.d/ /etc/entrypoint.d/
RUN chmod +x /etc/entrypoint.d/*.sh

USER www-data

# serversideup serveert HTTP op 8080 — zet in Railway de target-poort op 8080
EXPOSE 8080
