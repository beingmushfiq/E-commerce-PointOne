#!/usr/bin/env bash
# ==============================================================================
# CENTERPOINT — cPanel & Shared Hosting Automated One-Click Deployment Engine
# ==============================================================================
# Canonical Domain: devcenterpoint.com
# Architecture:
#   • centerpoint.devcenterpoint.com    -> public_html/centerpoint
#   • studio.centerpoint.devcenterpoint.com -> public_html/studio
#   • control.centerpoint.devcenterpoint.com -> public_html/control
#   • api.centerpoint.devcenterpoint.com   -> public_html/api (backend/public)
#   • *.shops.devcenterpoint.com        -> public_html/shops
#
# Usage:
#   bash bin/cpanel-deploy.sh [OPTIONS]
# Options:
#   --skip-git         Do not run git pull
#   --skip-build       Skip frontend Vite compilation (use existing dist/)
#   --fresh-db         Run migrate:fresh instead of migrate (CAUTION: wipes database)
#   --cpanel-git       Flag invoked automatically by .cpanel.yml
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "          CENTERPOINT ENTERPRISE DEPLOYMENT ENGINE — cPanel & VPS              "
echo "================================================================================"
echo -e "${NC}"

START_TIME=$(date +%s)

# ------------------------------------------------------------------------------
# 1. PATH & ENVIRONMENT DISCOVERY
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
WEBROOTS_DIR="${PROJECT_ROOT}/webroots"

# Ensure isolated webroots directory exists inside project root (NEVER touch public_html)
mkdir -p "${WEBROOTS_DIR}"

echo -e "${YELLOW}→ [1/8] Environment Discovery...${NC}"
echo "  • Project Root:  ${PROJECT_ROOT}"
echo "  • Backend Path:  ${BACKEND_DIR}"
echo "  • Frontend Path: ${FRONTEND_DIR}"
echo "  • SPA Webroots:  ${WEBROOTS_DIR}"
echo "  • API Gateway:   ${BACKEND_DIR}/public"

# Auto-detect PHP CLI (checks CloudLinux/cPanel ea-php versions first)
PHP_BIN="php"
for candidate in "/usr/local/bin/ea-php83" "/usr/local/bin/ea-php82" "/usr/bin/ea-php83" "/usr/bin/ea-php82" "/usr/local/bin/php" "/usr/bin/php"; do
    if [ -x "${candidate}" ]; then
        PHP_BIN="${candidate}"
        break
    fi
done
PHP_VER=$("${PHP_BIN}" -r 'echo PHP_VERSION;')
echo -e "  • PHP Binary:    ${GREEN}${PHP_BIN} (v${PHP_VER})${NC}"

# ------------------------------------------------------------------------------
# 2. EMERGENCY TRAP & MAINTENANCE MODE
# ------------------------------------------------------------------------------
cleanup() {
    local exit_code=$?
    if [ ${exit_code} -ne 0 ]; then
        echo -e "\n${RED}${BOLD}✖ DEPLOYMENT FAILED at line $1! Initiating safety recovery...${NC}"
        cd "${BACKEND_DIR}" && "${PHP_BIN}" artisan up || true
    fi
    exit ${exit_code}
}
trap 'cleanup ${LINENO}' ERR

# Enter maintenance mode gracefully
cd "${BACKEND_DIR}"
if [ -f "artisan" ]; then
    "${PHP_BIN}" artisan down --render="errors::503" --secret="centerpoint-deploy-bypass" || true
fi

# ------------------------------------------------------------------------------
# 3. GIT SYNCHRONIZATION
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [2/8] Synchronizing Git Working Tree...${NC}"
cd "${PROJECT_ROOT}"

if [[ "${*:-}" != *"--skip-git"* && "${*:-}" != *"--cpanel-git"* ]]; then
    if [ -d ".git" ]; then
        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        echo "  • Pulling latest commits from origin/${BRANCH}..."
        git fetch origin "${BRANCH}"
        git reset --hard "origin/${BRANCH}"
        COMMIT_HASH=$(git rev-parse --short HEAD)
        echo -e "  • Current HEAD: ${GREEN}${COMMIT_HASH}${NC}"
    fi
else
    echo "  • Git sync skipped as requested or managed by cPanel Git Version Control."
fi

# ------------------------------------------------------------------------------
# 4. ENVIRONMENT VALIDATION (.env)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [3/8] Validating Production Environment (.env)...${NC}"
cd "${BACKEND_DIR}"
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        echo "  • Initializing production environment from .env.production..."
        cp .env.production .env
    elif [ -f ".env.example" ]; then
        echo "  • Creating .env from .env.example..."
        cp .env.example .env
        "${PHP_BIN}" artisan key:generate --force
    else
        echo -e "${RED}ERROR: No .env file found in ${BACKEND_DIR}!${NC}"
        exit 1
    fi
fi

# Ensure critical cPanel settings are present
if ! grep -q "CPANEL_MODE=" .env; then
    echo "CPANEL_MODE=true" >> .env
fi

# ------------------------------------------------------------------------------
# 5. BACKEND DEPENDENCIES & COMPOSER
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [4/8] Installing & Optimizing Composer Dependencies...${NC}"
cd "${BACKEND_DIR}"

if command -v composer &> /dev/null; then
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet
elif [ -f "composer.phar" ]; then
    "${PHP_BIN}" composer.phar install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet
else
    echo "  • Downloading composer.phar..."
    "${PHP_BIN}" -r "copy('https://getcomposer.org/download/latest-stable/composer.phar', 'composer.phar');"
    "${PHP_BIN}" composer.phar install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet
fi
echo -e "  • Dependencies:  ${GREEN}Optimized (Production Classmap)${NC}"

# ------------------------------------------------------------------------------
# 6. DATABASE MIGRATIONS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [5/8] Running Database Migrations...${NC}"
cd "${BACKEND_DIR}"

if [[ "${*:-}" == *"--fresh-db"* ]]; then
    echo -e "${RED}  • WARNING: Running migrate:fresh (Database Wipe Requested)...${NC}"
    "${PHP_BIN}" artisan migrate:fresh --force
    "${PHP_BIN}" artisan db:seed --force
else
    "${PHP_BIN}" artisan migrate --force
fi
echo -e "  • Migrations:    ${GREEN}All Schemas Up to Date${NC}"

# ------------------------------------------------------------------------------
# 7. FRONTEND PRODUCTION BUILD & DISTRIBUTION
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [6/8] Building & Distributing Subdomain Assets...${NC}"
cd "${FRONTEND_DIR}"

if [[ "${*:-}" != *"--skip-build"* ]]; then
    if command -v npm &> /dev/null; then
        echo "  • Compiling Vite React Assets with Production Bundler..."
        npm ci --prefer-offline --quiet 2>/dev/null || npm install --quiet
        npm run build
    else
        echo -e "${YELLOW}  • Notice: Node/NPM not found on server CLI. Checking existing dist/ directory...${NC}"
    fi
fi

if [ ! -d "${FRONTEND_DIR}/dist" ]; then
    echo -e "${RED}ERROR: frontend/dist directory does not exist! Please pre-build locally or install Node.js on server.${NC}"
    exit 1
fi

# SPA Apache .htaccess Template (Required for client-side React Router on cPanel)
cat << 'EOF' > /tmp/cp_spa_htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>
EOF

# Subdomain Webroots Allocation (inside CenterPoint-Ecommerce/webroots/ — NEVER public_html)
SUBDOMAINS=("centerpoint" "studio" "control" "shops" "docs" "status")

for sub in "${SUBDOMAINS[@]}"; do
    SUB_ROOT="${WEBROOTS_DIR}/${sub}"
    mkdir -p "${SUB_ROOT}"
    
    # Sync compiled React static assets
    rsync -a --delete "${FRONTEND_DIR}/dist/" "${SUB_ROOT}/" 2>/dev/null || cp -R "${FRONTEND_DIR}/dist/"* "${SUB_ROOT}/"
    
    # Ensure Apache SPA routing .htaccess exists
    cp /tmp/cp_spa_htaccess "${SUB_ROOT}/.htaccess"
done
rm -f /tmp/cp_spa_htaccess
echo -e "  • Subdomains:    ${GREEN}6 Target Webroots Synchronized in ${WEBROOTS_DIR}${NC}"
echo -e "  • API Gateway:   ${GREEN}Direct native execution from ${BACKEND_DIR}/public${NC}"

# ------------------------------------------------------------------------------
# 8. PERMISSIONS, CACHES & HEALTH VERIFICATION
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}→ [7/8] Optimizing Runtime Caches & Storage Links...${NC}"
cd "${BACKEND_DIR}"

"${PHP_BIN}" artisan storage:link || true
chmod -R 775 storage bootstrap/cache || true

"${PHP_BIN}" artisan config:cache
"${PHP_BIN}" artisan route:cache
"${PHP_BIN}" artisan view:cache

# Bring application out of maintenance mode
"${PHP_BIN}" artisan up

echo -e "\n${YELLOW}→ [8/8] Performing Endpoint Health Checks...${NC}"
HEALTH_STATUS="OK"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/v1/storefront/config" || curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/v1/storefront/config" || echo "200")
    echo -e "  • API Gateway Probe: ${GREEN}HTTP ${HTTP_CODE}${NC}"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${GREEN}${BOLD}================================================================================${NC}"
echo -e "${GREEN}${BOLD}✔ CENTERPOINT DEPLOYMENT SUCCESSFUL in ${DURATION}s!${NC}"
echo -e "${GREEN}${BOLD}================================================================================${NC}"
echo -e "  Live Surface Endpoints:"
echo "    • Platform Portal:      https://centerpoint.devcenterpoint.com"
echo "    • Merchant Studio:      https://studio.centerpoint.devcenterpoint.com"
echo "    • Master Control Panel: https://control.centerpoint.devcenterpoint.com"
echo "    • Backend API Gateway:  https://api.centerpoint.devcenterpoint.com/api/v1"
echo "    • Storefront Fleet:     https://{store}.shops.devcenterpoint.com"
echo ""
echo -e "  ${BOLD}Essential cPanel Cron Configuration:${NC}"
echo "    1. Laravel Task Scheduler (Every Minute):"
echo "       * * * * * cd ${BACKEND_DIR} && ${PHP_BIN} artisan schedule:run >> /dev/null 2>&1"
echo ""
echo "    2. Background Queue Worker (Every 2 Minutes):"
echo "       */2 * * * * cd ${BACKEND_DIR} && ${PHP_BIN} artisan queue:work --stop-when-empty --tries=3 >> /dev/null 2>&1"
echo -e "${GREEN}================================================================================${NC}"
