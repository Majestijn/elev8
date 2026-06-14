#!/bin/sh
# Draait bij container-start (serversideup entrypoint), vóór php-fpm/nginx.
set -e

cd /var/www/html

echo "[elev8] Running database migrations…"
php artisan migrate --force

echo "[elev8] Linking storage (voor lokale public-foto's)…"
php artisan storage:link || true

echo "[elev8] Caching config & routes…"
php artisan config:cache
php artisan route:cache

echo "[elev8] Boot prep done."
