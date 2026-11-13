#!/usr/bin/env bash
# ==============================================================================
# CENTERPOINT — Release Packaging Script (Standalone & SaaS Editions)
# ==============================================================================
# Usage:
#   bash bin/package-release.sh [standalone|saas] [version]
# Example:
#   bash bin/package-release.sh standalone 1.0.0
# ==============================================================================

set -euo pipefail

EDITION="${1:-standalone}"
VERSION="${2:-1.0.0}"
RELEASE_NAME="centerpoint-${EDITION}-v${VERSION}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
TARGET_DIR="${DIST_DIR}/${RELEASE_NAME}"

echo "=========================================================="
echo "  CENTERPOINT Release Packager"
echo "  Edition: ${EDITION}"
echo "  Version: ${VERSION}"
echo "  Output:  ${RELEASE_NAME}.zip"
echo "=========================================================="

# 1. Clean previous builds
mkdir -p "${DIST_DIR}"
rm -rf "${TARGET_DIR}" "${DIST_DIR}/${RELEASE_NAME}.zip"
mkdir -p "${TARGET_DIR}"

# 2. Compile Frontend
echo "[1/5] Compiling frontend assets..."
cd "${ROOT_DIR}/frontend"
npm ci --prefer-offline || npm install
npm run build

# 3. Assemble Release Payload
echo "[2/5] Assembling release payload..."
mkdir -p "${TARGET_DIR}/backend"
mkdir -p "${TARGET_DIR}/docs"

# Copy backend application source
cp -R "${ROOT_DIR}/backend/app" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/bootstrap" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/config" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/database" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/public" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/resources" "${TARGET_DIR}/backend/"
cp -R "${ROOT_DIR}/backend/routes" "${TARGET_DIR}/backend/"
cp "${ROOT_DIR}/backend/artisan" "${TARGET_DIR}/backend/"
cp "${ROOT_DIR}/backend/composer.json" "${TARGET_DIR}/backend/"
cp "${ROOT_DIR}/backend/composer.lock" "${TARGET_DIR}/backend/"

# Embed compiled frontend into public webroot
cp -R "${ROOT_DIR}/frontend/dist/"* "${TARGET_DIR}/backend/public/"

# Create empty storage directory skeleton
mkdir -p "${TARGET_DIR}/backend/storage/app/public"
mkdir -p "${TARGET_DIR}/backend/storage/framework/cache/data"
mkdir -p "${TARGET_DIR}/backend/storage/framework/sessions"
mkdir -p "${TARGET_DIR}/backend/storage/framework/views"
mkdir -p "${TARGET_DIR}/backend/storage/logs"

# Copy deployment tools & guides
mkdir -p "${TARGET_DIR}/bin"
cp "${ROOT_DIR}/bin/cpanel-deploy.sh" "${TARGET_DIR}/bin/"
cp -R "${ROOT_DIR}/docs/deployment" "${TARGET_DIR}/docs/"

# 4. Generate Edition-Specific Environment File
echo "[3/5] Configuring environment presets for ${EDITION} edition..."
if [ "${EDITION}" == "saas" ]; then
    cat << 'EOF' > "${TARGET_DIR}/backend/.env.example"
APP_NAME=CENTERPOINT-SaaS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://platform.centerpoint.test

CENTERPOINT_EDITION=saas
FEATURE_MULTIPLE_STOREFRONTS=true
FEATURE_AI_ASSISTANT=true
FEATURE_MARKETING_CAPI=true
FEATURE_ACCOUNTING=true
FEATURE_CUSTOM_CODE_SANDBOX=true

# Central Platform Database
CENTRAL_DB_CONNECTION=central
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=centerpoint_central
DB_USERNAME=root
DB_PASSWORD=

# Cache, Queue, and Sessions
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
EOF
else
    cat << 'EOF' > "${TARGET_DIR}/backend/.env.example"
APP_NAME=CENTERPOINT
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com

CENTERPOINT_EDITION=standalone
FEATURE_MULTIPLE_STOREFRONTS=false
FEATURE_AI_ASSISTANT=true
FEATURE_MARKETING_CAPI=true
FEATURE_ACCOUNTING=true
FEATURE_CUSTOM_CODE_SANDBOX=true

# cPanel / Shared Hosting Profile
CPANEL_MODE=true
CPANEL_FORCE_DB_QUEUE=true
CPANEL_FORCE_DB_CACHE=true

# Single Commerce Database (MySQL / SQLite)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=centerpoint_store
DB_USERNAME=cpanel_user
DB_PASSWORD=secret_password

# Database-Backed Queue & Cache
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
EOF
fi

# 5. Production Vendor Installation
echo "[4/5] Installing production vendor packages..."
cd "${TARGET_DIR}/backend"
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# 6. Archive Creation
echo "[5/5] Creating release archive..."
cd "${DIST_DIR}"
if command -v zip &> /dev/null; then
    zip -rq "${RELEASE_NAME}.zip" "${RELEASE_NAME}"
    echo "  Package built: ${DIST_DIR}/${RELEASE_NAME}.zip"
else
    tar -czf "${RELEASE_NAME}.tar.gz" "${RELEASE_NAME}"
    echo "  Package built: ${DIST_DIR}/${RELEASE_NAME}.tar.gz"
fi

echo "=========================================================="
echo "  CENTERPOINT ${EDITION} Release Package Complete!"
echo "=========================================================="

