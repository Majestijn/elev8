#!/bin/sh
# Draait bij container-start (serversideup entrypoint), vóór php-fpm/nginx.
set -e

cd /var/www/html

# LET OP: migrate:fresh DROPT de hele database bij elke deploy (alle data weg).
# Bewust gekozen tijdens de MVP-fase (alleen testdata). Vóór echte klanten
# terugzetten naar `php artisan migrate --force` + incrementele migraties.
echo "[urbanlift] Running fresh database migration (DROPT alle data!)…"
php artisan migrate:fresh --force

echo "[urbanlift] Linking storage (voor lokale public-foto's)…"
php artisan storage:link || true

echo "[urbanlift] Caching config & routes…"
php artisan config:cache
php artisan route:cache

echo "[urbanlift] Boot prep done."
