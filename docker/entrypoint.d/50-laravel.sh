#!/bin/sh
# Draait bij container-start (serversideup entrypoint), vóór php-fpm/nginx.
set -e

cd /var/www/html

# Incrementele migraties: alleen nog-niet-gedraaide migraties worden uitgevoerd,
# bestaande data blijft staan. (Voorheen migrate:fresh, dat DROPTE alle data bij
# elke deploy — niet meer gewenst nu er echte boekingen binnenkomen.)
echo "[urbanlift] Running database migrations (incrementeel, data blijft)…"
php artisan migrate --force

echo "[urbanlift] Linking storage (voor lokale public-foto's)…"
php artisan storage:link || true

echo "[urbanlift] Caching config & routes…"
php artisan config:cache
php artisan route:cache

echo "[urbanlift] Boot prep done."
