#!/usr/bin/env bash
# ==============================================================================
# CENTERPOINT — cPanel & Shared Hosting Automated Deployment Script
# ==============================================================================
# Usage:
#   bash bin/cpanel-deploy.sh [options]
# Options:
#   --skip-build       Skip frontend vite build step
#   --fresh-db         Run migrate:fresh instead of migrate (CAUTION: wipes database)
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  CENTERPOINT — cPanel Deployment Automation"
echo "=========================================================="

# 1. Environment & Path Discovery
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "[1/7] Discovering project directories..."
echo "  Root:    ${ROOT_DIR}"
echo "  Backend: ${BACKEND_DIR}"
echo "  Frontend:${FRONTEND_DIR}"

# 2. Check PHP and Composer
echo "[2/7] Checking runtime dependencies..."
if ! command -v php &> /dev/null; then
    echo "ERROR: PHP CLI is not installed or not in PATH."
    exit 1
fi
PHP_VERSION=$(php -r 'echo PHP_VERSION;')
echo "  Detected PHP Version: ${PHP_VERSION}"

# 3. Backend Dependency Optimization
echo "[3/7] Installing & optimizing Composer dependencies..."
cd "${BACKEND_DIR}"
if [ -f "composer.phar" ]; then
    php composer.phar install --no-dev --prefer-dist --optimize-autoloader --no-interaction
else
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
fi

# 4. Frontend Production Build
if [[ "${1:-}" != "--skip-build" ]]; then
    echo "[4/7] Compiling frontend assets via Vite..."
    cd "${FRONTEND_DIR}"
    if command -v npm &> /dev/null; then
        npm ci --prefer-offline || npm install
        npm run build
        
        echo "  Copying compiled frontend assets to backend public webroot..."
        mkdir -p "${BACKEND_DIR}/public/assets"
        cp -R "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/"
    else
        echo "  WARNING: Node/NPM not found. Assuming frontend assets were pre-compiled in dist/."
    fi
else
    echo "[4/7] Skipping frontend build as requested."
fi

# 5. Storage Symlink & Permissions
echo "[5/7] Configuring storage symlinks and directory permissions..."
cd "${BACKEND_DIR}"
php artisan storage:link || true

chmod -R 775 storage bootstrap/cache || true
echo "  Storage permissions set to 775."

# 6. Database Migrations
echo "[6/7] Running database migrations..."
if [[ "${1:-}" == "--fresh-db" || "${2:-}" == "--fresh-db" ]]; then
    echo "  WARNING: Running migrate:fresh on production database..."
    php artisan migrate:fresh --force
else
    php artisan migrate --force
fi

# 7. Production Cache Optimization
echo "[7/7] Optimizing Laravel configuration, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=========================================================="
echo "  CENTERPOINT Deployment Complete!"
echo "=========================================================="
echo "  Next steps for cPanel Cron configuration:"
echo "  1. Scheduler Cron (Every minute):"
echo "     * * * * * cd ${BACKEND_DIR} && php artisan schedule:run >> /dev/null 2>&1"
echo ""
echo "  2. Queue Worker Fallback Cron (Every 2-5 minutes):"
echo "     */3 * * * * cd ${BACKEND_DIR} && php artisan queue:work --stop-when-empty --tries=3 >> /dev/null 2>&1"
echo "=========================================================="

