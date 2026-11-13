# ==============================================================================
# CENTERPOINT — Release Packaging Script (Windows PowerShell)
# ==============================================================================
# Usage:
#   .\bin\package-release.ps1 -Edition standalone -Version 1.0.0
# ==============================================================================

param (
    [string]$Edition = "standalone",
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

$ReleaseName = "centerpoint-$Edition-v$Version"
$RootDir = Resolve-Path "$PSScriptRoot\.."
$DistDir = "$RootDir\dist"
$TargetDir = "$DistDir\$ReleaseName"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CENTERPOINT Release Packager" -ForegroundColor Cyan
Write-Host "  Edition: $Edition" -ForegroundColor Green
Write-Host "  Version: $Version" -ForegroundColor Green
Write-Host "  Output:  $ReleaseName.zip" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean previous build
if (Test-Path $TargetDir) {
    Remove-Item -Path $TargetDir -Recurse -Force
}
if (Test-Path "$DistDir\$ReleaseName.zip") {
    Remove-Item -Path "$DistDir\$ReleaseName.zip" -Force
}
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null

# 2. Build Frontend
Write-Host "[1/5] Compiling frontend assets via Vite..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"
npm run build

# 3. Assemble Release Files
Write-Host "[2/5] Assembling backend release payload..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$TargetDir\backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$TargetDir\docs" -Force | Out-Null

$BackendDirs = @("app", "bootstrap", "config", "database", "public", "resources", "routes")
foreach ($dir in $BackendDirs) {
    Copy-Item -Path "$RootDir\backend\$dir" -Destination "$TargetDir\backend\$dir" -Recurse -Force
}

Copy-Item -Path "$RootDir\backend\artisan" -Destination "$TargetDir\backend\artisan"
Copy-Item -Path "$RootDir\backend\composer.json" -Destination "$TargetDir\backend\composer.json"
Copy-Item -Path "$RootDir\backend\composer.lock" -Destination "$TargetDir\backend\composer.lock"

# Copy compiled frontend into backend public webroot
Copy-Item -Path "$RootDir\frontend\dist\*" -Destination "$TargetDir\backend\public\" -Recurse -Force

# Create storage skeleton
$StorageDirs = @(
    "storage\app\public",
    "storage\framework\cache\data",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\logs"
)
foreach ($dir in $StorageDirs) {
    New-Item -ItemType Directory -Path "$TargetDir\backend\$dir" -Force | Out-Null
}

# Copy deployment tools
New-Item -ItemType Directory -Path "$TargetDir\bin" -Force | Out-Null
Copy-Item -Path "$RootDir\bin\cpanel-deploy.sh" -Destination "$TargetDir\bin\cpanel-deploy.sh"
Copy-Item -Path "$RootDir\docs\deployment" -Destination "$TargetDir\docs\deployment" -Recurse -Force

# 4. Generate Environment Presets
Write-Host "[3/5] Writing .env.example preset for $Edition edition..." -ForegroundColor Yellow
if ($Edition -eq "saas") {
    $envContent = @"
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
"@
} else {
    $envContent = @"
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
"@
}
Set-Content -Path "$TargetDir\backend\.env.example" -Value $envContent

# 5. Composer install
Write-Host "[4/5] Installing production Composer packages..." -ForegroundColor Yellow
Set-Location "$TargetDir\backend"
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# 6. Compress Archive
Write-Host "[5/5] Compressing release archive into zip..." -ForegroundColor Yellow
Set-Location $DistDir
Compress-Archive -Path $ReleaseName -DestinationPath "$DistDir\$ReleaseName.zip" -Force

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  CENTERPOINT $Edition Release Complete: $DistDir\$ReleaseName.zip" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

