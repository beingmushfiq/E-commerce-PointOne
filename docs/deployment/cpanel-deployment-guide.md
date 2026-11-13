# CENTERPOINT — cPanel & Shared Hosting Production Deployment Guide

## 1. Overview & Operational Profile

CENTERPOINT Standalone Edition is architected to run seamlessly in cost-effective cPanel and shared hosting environments without sacrificing financial integrity, inventory race safety, or SEO performance.

Unlike traditional SaaS platforms that enforce long-running daemons (e.g., Supervisord, Horizon, Redis servers), CENTERPOINT provides an explicit **cPanel Operating Profile**:
- **Database Engine:** Single MySQL database (or SQLite for small catalogs / staging).
- **Queue Worker:** Database-backed queue with a periodic cron execution (`php artisan queue:work --stop-when-empty`).
- **Cache & Sessions:** Database-backed cache and session storage eliminating external Redis requirements.
- **Static Asset Serving:** Compiled Vite assets pre-bundled directly into Laravel's public directory.
- **Web Server:** Apache with `.htaccess` mod_rewrite and Content-Security-Policy headers.

---

## 2. Directory Layout on cPanel

To ensure maximum security, **never place the entire application code directly inside `public_html`**. Application source code, configuration files, and SQLite/log files must live above the web root.

### Recommended Filesystem Layout

```
/home/username/
├── centerpoint/                # Private application directory (OUTSIDE webroot)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── storage/
│   ├── vendor/
│   ├── artisan
│   └── .env
└── public_html/                # Publicly accessible webroot
    ├── assets/                 # Compiled Vite React JS/CSS
    ├── storage -> ../centerpoint/storage/app/public
    ├── index.php               # Laravel bootstrap entrypoint
    ├── manifest.json           # PWA Manifest
    ├── sw.js                   # PWA Service Worker
    ├── robots.txt              # Dynamic or static robots.txt
    └── .htaccess               # Apache URL rewrite rules
```

---

## 3. Step-by-Step Installation Procedure

### Step 1: Upload & Extract Release
1. Log into your cPanel File Manager (or connect via SFTP/SSH).
2. Create a folder named `centerpoint` in `/home/username/`.
3. Upload `centerpoint-standalone-v1.0.0.zip` and extract its contents into `/home/username/centerpoint`.
4. Copy or move everything from `/home/username/centerpoint/backend/public/*` into `/home/username/public_html/`.

### Step 2: Configure `public_html/index.php`
Edit `/home/username/public_html/index.php` to point to the private `centerpoint` directory:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../centerpoint/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../centerpoint/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../centerpoint/bootstrap/app.php')
    ->handleRequest(Request::capture());
```

### Step 3: Create MySQL Database in cPanel
1. Open **cPanel > MySQL Database Wizard**.
2. Create a database: e.g., `username_centerpoint`.
3. Create a database user: e.g., `username_dbuser` with a strong password.
4. Assign the user to the database with **ALL PRIVILEGES**.

### Step 4: Configure `.env`
In `/home/username/centerpoint/.env`, configure the cPanel operational settings:

```env
APP_NAME=CENTERPOINT
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://yourstore.com

# Deployment Edition & Profile
CENTERPOINT_EDITION=standalone
CPANEL_MODE=true
CPANEL_FORCE_DB_QUEUE=true
CPANEL_FORCE_DB_CACHE=true

# Database Credentials
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=username_centerpoint
DB_USERNAME=username_dbuser
DB_PASSWORD=your_secure_password

# Database Queue & Cache Fallbacks
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database

# Mail Configuration (cPanel Exim / SMTP)
MAIL_MAILER=smtp
MAIL_HOST=mail.yourstore.com
MAIL_PORT=465
MAIL_USERNAME=noreply@yourstore.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="noreply@yourstore.com"
MAIL_FROM_NAME="CENTERPOINT Store"
```

### Step 5: Run Database Migrations
If you have SSH access:
```bash
cd /home/username/centerpoint
php artisan migrate --force
php artisan db:seed --class=ChartOfAccountsSeeder --force
```

If you do NOT have SSH access:
Use the cPanel **Cron Jobs** tool to execute a one-time migration command:
```bash
/usr/local/bin/php /home/username/centerpoint/artisan migrate --force
```
*(Remove the cron job once completed).*

### Step 6: Create Storage Symlink
Via SSH:
```bash
cd /home/username/centerpoint
php artisan storage:link
```
Or manually in File Manager, create a symbolic link from `/home/username/public_html/storage` targeting `/home/username/centerpoint/storage/app/public`.

---

## 4. Cron Configuration for Background Jobs & Scheduled Tasks

In shared hosting environments without Supervisord, set up two cron jobs via **cPanel > Cron Jobs**:

### 1. The Laravel Scheduler (Runs Every Minute)
Executes scheduled tasks, sitemap regenerations, catalog index updates, and report aggregation.
```cron
* * * * * /usr/local/bin/php /home/username/centerpoint/artisan schedule:run >> /dev/null 2>&1
```

### 2. The Fallback Queue Worker (Runs Every 2 to 5 Minutes)
Processes queued jobs (e.g. Meta CAPI events, order confirmation emails, invoice generation). With `--stop-when-empty`, it gracefully exits as soon as the queue is drained, avoiding process accumulation or hosting memory limit kills.
```cron
*/3 * * * * /usr/local/bin/php /home/username/centerpoint/artisan queue:work --stop-when-empty --tries=3 --max-jobs=50 >> /dev/null 2>&1
```

---

## 5. Security & Content Security Policy (CSP)

Ensure your `/home/username/public_html/.htaccess` enforces HTTPS and isolates custom code:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Enforce HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

