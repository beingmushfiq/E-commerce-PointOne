# CENTERPOINT — cPanel Production Deployment & Automation Guide
**Multi-Subdomain SaaS & Standalone Hybrid Architecture**  
**Target Domain:** `devcenterpoint.com` | **Account User:** `devcente` | **App Root:** `/home/devcente/CenterPoint-Ecommerce`  
**Stack:** Laravel 13 (PHP 8.3) + React 19 / Vite + MySQL 8.0

---

## 1. Architectural Summary & Operating Topology

CENTERPOINT is deployed on cPanel with top-tier security isolation, separating backend code from public webroots while isolating each surface into dedicated subdomains:

```
/home/devcente/
├── CenterPoint-Ecommerce/                  # Private application repository (OUTSIDE webroot)
│   ├── backend/                           # Laravel 13 API core
│   │   ├── app/
│   │   ├── config/
│   │   ├── storage/
│   │   ├── vendor/
│   │   └── artisan
│   ├── frontend/                          # React 19 + Vite SPA source
│   ├── bin/
│   │   └── cpanel-deploy.sh               # Master deployment engine
│   ├── .cpanel.yml                        # cPanel Git Version Control deployment trigger
│   ├── deploy.sh                          # Root one-click terminal wrapper
│   └── .env                               # Production environment secrets
│
└── public_html/                           # cPanel Document Root Area (/home/devcente/public_html)
    ├── api/                               # Backend API Ingress (api.centerpoint.devcenterpoint.com)
    │   ├── index.php                      # Bridge front controller pointing to CenterPoint-Ecommerce/backend
    │   ├── .htaccess                      # Apache bearer token & rewrite rules
    │   └── storage -> ../../CenterPoint-Ecommerce/backend/storage/app/public
    ├── centerpoint/                       # Marketing & Landing SPA (centerpoint.devcenterpoint.com)
    ├── studio/                            # Merchant Studio SPA (studio.centerpoint.devcenterpoint.com)
    ├── control/                           # Master Control Panel SPA (control.centerpoint.devcenterpoint.com)
    ├── shops/                             # Wildcard Tenant Storefront SPA (*.shops.devcenterpoint.com)
    ├── docs/                              # Documentation SPA (docs.centerpoint.devcenterpoint.com)
    └── status/                            # System Status SPA (status.centerpoint.devcenterpoint.com)
```

---

## 2. Part 1: Subdomain Creation & Ingress Routing in cPanel GUI

Log into **cPanel** for user `devcente` and navigate to **Domains** (or **Subdomains** in older paper_lantern themes).

Create each subdomain with its exact Document Root relative to `/home/devcente/`:

| No | Subdomain | Document Root | Target Purpose |
| :--- | :--- | :--- | :--- |
| **1** | `api.centerpoint.devcenterpoint.com` | `public_html/api` | REST API gateway & OAuth token verification |
| **2** | `centerpoint.devcenterpoint.com` | `public_html/centerpoint` | Main product marketing, registration & onboarding SPA |
| **3** | `studio.centerpoint.devcenterpoint.com` | `public_html/studio` | Merchant administration, orders, products & Visual CMS SPA |
| **4** | `control.centerpoint.devcenterpoint.com` | `public_html/control` | Superadmin Master Control Panel (SaaS tenant manager) |
| **5** | `docs.centerpoint.devcenterpoint.com` | `public_html/docs` | Developer API documentation & merchant user manuals |
| **6** | `status.centerpoint.devcenterpoint.com` | `public_html/status` | Real-time system health, telemetry & incident notices |
| **7** | `*.shops.devcenterpoint.com` | `public_html/shops` | Multi-tenant customer storefronts (`{store}.shops...`) |

> [!TIP]
> In cPanel's **Subdomains** interface, for wildcard tenant storefronts, simply enter `*` in the **Subdomain** field and select `shops.devcenterpoint.com` from the domain dropdown. Set the document root to `public_html/shops`.

### 2.1 SSL / AutoSSL Certificate Issuance
1. Navigate to **cPanel > SSL/TLS Status**.
2. Check all subdomains:
   - `api.centerpoint.devcenterpoint.com`
   - `centerpoint.devcenterpoint.com`
   - `studio.centerpoint.devcenterpoint.com`
   - `control.centerpoint.devcenterpoint.com`
   - `docs.centerpoint.devcenterpoint.com`
   - `status.centerpoint.devcenterpoint.com`
   - `*.shops.devcenterpoint.com`
3. Click **Run AutoSSL**. AutoSSL will automatically generate Let's Encrypt / Sectigo certificates for all domains.
4. *(If DNS is managed via Cloudflare)*: Set Cloudflare SSL/TLS encryption mode to **Full (Strict)**, and generate a Cloudflare Origin Certificate to cover `devcenterpoint.com` and `*.devcenterpoint.com`, `*.shops.devcenterpoint.com`.

---

## 3. Part 2: Database Architecture & Partitioning on cPanel

### 3.1 Central Platform Database
The central database stores tenant accounts, domain routing tables, platform audit logs, and global billing subscriptions.

1. Navigate to **cPanel > MySQL® Database Wizard**.
2. **Step 1 — Create Database:**
   - Database name: `devcente_cp_central`
3. **Step 2 — Create Database User:**
   - Username: `devcente_cp_master`
   - Generate a secure 24+ character password and store it in your `.env`.
4. **Step 3 — Assign Privileges:**
   - Check **ALL PRIVILEGES**.
   - Collation: `utf8mb4_unicode_ci` (default in MySQL 8.0).

### 3.2 Tenant Database Partitioning Strategies
On cPanel, CENTERPOINT supports two tenant isolation modes:

#### Strategy A: Dedicated Databases per Tenant (High Isolation)
- Database name pattern: `devcente_tnt_{tenant_slug}` (e.g., `devcente_tnt_fashionhouse`).
- Assign the master user `devcente_cp_master` with **ALL PRIVILEGES** to each tenant database.
- Automated creation via cPanel UAPI:
  ```bash
  uapi Mysql create_database name="devcente_tnt_${SLUG}"
  uapi Mysql set_privileges_on_database user="devcente_cp_master" database="devcente_tnt_${SLUG}" privileges="ALL PRIVILEGES"
  ```

#### Strategy B: Shared Schema with Tenant ID Partitioning (Recommended for Shared Hosting)
- Set `CPANEL_MODE=true` in `.env`.
- All operational data runs within `devcente_cp_central`, partitioned by indexed `tenant_id` foreign keys, with database-backed queue and cache enabled.

---

## 4. Part 3: cPanel Git™ Version Control Setup

### 4.1 Set Up Deployment Key in cPanel
1. Open **cPanel > Terminal** (or SSH into `devcente@your-server-ip`).
2. Generate an SSH key for deployment:
   ```bash
   ssh-keygen -t ed25519 -C "deploy@devcenterpoint.com" -f ~/.ssh/id_ed25519_deploy -N ""
   cat ~/.ssh/id_ed25519_deploy.pub
   ```
3. Copy the public key and add it as a **Deploy Key** (Read-Only) in your GitHub / GitLab repository settings.

### 4.2 Initialize Git Repository in cPanel GUI
1. Navigate to **cPanel > Git™ Version Control**.
2. Click **Create**:
   - **Clone Repository:** Enabled
   - **Clone URL:** `git@github.com:your-org/E-commerce-PointOne.git`
   - **Repository Path:** `CenterPoint-Ecommerce` (this creates `/home/devcente/CenterPoint-Ecommerce`)
   - **Repository Name:** `CenterPoint-Ecommerce`
3. Click **Create**. cPanel clones the codebase directly into `/home/devcente/CenterPoint-Ecommerce`.

### 4.3 Automated `.cpanel.yml` Hook
The repository includes [.cpanel.yml](file:///d:/E-commerce-PointOne/.cpanel.yml) in the root:

```yaml
---
deployment:
  tasks:
    - export PROJECT_ROOT=$(pwd)
    - /bin/bash bin/cpanel-deploy.sh --cpanel-git
```

Whenever you push to `main` (via GitHub webhook) or click **Update from Remote > Deploy HEAD Commit** in cPanel Git, cPanel automatically executes `bin/cpanel-deploy.sh`!

---

## 5. Part 4: One-Click Terminal Deployment Script

In the **cPanel Terminal**, you can deploy, update, or rebuild the entire platform with one command:

```bash
cd /home/devcente/CenterPoint-Ecommerce
bash deploy.sh
```

### 5.1 Deployment Options
| Command | Action |
| :--- | :--- |
| `bash deploy.sh` | **Full Production Deploy:** Maintenance mode, git sync, composer install, frontend build, multi-subdomain asset distribution, migrations, cache, health checks. |
| `bash deploy.sh --quick` | **Quick Deploy:** Skips heavy Composer update and asset rebuild; runs migrations, clears/optimizes cache, and reloads. |
| `bash deploy.sh --skip-build` | **Backend-Only Deploy:** Pulls git changes, installs composer packages, runs migrations, and rebuilds caches. |
| `bash deploy.sh --fresh` | **Fresh Seed Deploy:** (Staging only) Runs `migrate:fresh --seed` with sample catalog data. |

### 5.2 What the Deployment Engine Executes Under the Hood
1. **PHP CLI Detection:** Automatically selects `/usr/local/bin/ea-php83` (or `ea-php82`, `/usr/local/bin/php`).
2. **Maintenance Mode Trap:** Enters maintenance mode gracefully with a secret bypass; an automated `trap` triggers `php artisan up` on any unexpected error to prevent store downtime.
3. **Classmap Optimization:** Runs `composer install --no-dev --optimize-autoloader`.
4. **Vite Compilation & Distribution:** Compiles the React 19 SPA and distributes the bundled assets into all 6 frontend webroots (`public_html/centerpoint`, `studio`, `control`, `shops`, `docs`, `status`).
5. **Apache `.htaccess` Generation:** Creates mod_rewrite rules in every frontend directory so React Router client-side routing works seamlessly on Apache.
6. **API Bridge Front Controller:** Configures `public_html/api/index.php` to bridge incoming API requests to `/home/devcente/CenterPoint-Ecommerce/backend` and preserves HTTP `Authorization` headers.
7. **Database Migrations & Storage Link:** Runs `php artisan migrate --force` and links `storage/app/public`.
8. **Cache Compilation & Health Probe:** Optimizes Laravel config, route, and view classmaps, and executes an HTTP health check.

---

## 6. Part 5: Production `.env` Configuration File

Create `/home/devcente/CenterPoint-Ecommerce/backend/.env`:

```ini
APP_NAME=CENTERPOINT
APP_ENV=production
APP_KEY=base64:GENERATE_WITH_ARTISAN_KEY_GENERATE
APP_DEBUG=false
APP_URL=https://api.centerpoint.devcenterpoint.com

# Multi-Tenant & Domain Routing
CENTERPOINT_EDITION=saas
CENTERPOINT_DOMAIN_SUFFIX=shops.devcenterpoint.com
CENTERPOINT_MARKETING_URL=https://centerpoint.devcenterpoint.com
CENTERPOINT_STUDIO_URL=https://studio.centerpoint.devcenterpoint.com
CENTERPOINT_CONTROL_URL=https://control.centerpoint.devcenterpoint.com
CENTERPOINT_API_URL=https://api.centerpoint.devcenterpoint.com
CENTERPOINT_DOCS_URL=https://docs.centerpoint.devcenterpoint.com
CENTERPOINT_STATUS_URL=https://status.centerpoint.devcenterpoint.com

# cPanel Operational Profile (Resilient & Daemonless)
CPANEL_MODE=true
CPANEL_FORCE_DB_QUEUE=true
CPANEL_FORCE_DB_CACHE=true

# Database Credentials
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=devcente_cp_central
DB_USERNAME=devcente_cp_master
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD

# Cache, Queue & Session (Database Fallback)
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
SESSION_LIFETIME=120

# Storage Driver
FILESYSTEM_DISK=public

# Mail Configuration (cPanel Exim SMTP)
MAIL_MAILER=smtp
MAIL_HOST=mail.devcenterpoint.com
MAIL_PORT=465
MAIL_USERNAME=noreply@devcenterpoint.com
MAIL_PASSWORD=YOUR_EMAIL_ACCOUNT_PASSWORD
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="noreply@devcenterpoint.com"
MAIL_FROM_NAME="CENTERPOINT Platform"
```

---

## 7. Part 6: cPanel Cron Configuration

Navigate to **cPanel > Cron Jobs**:

### Cron 1: Laravel Task Scheduler (Every Minute)
Runs scheduled analytics aggregation, inventory reorder checks, and automated billing:
```bash
* * * * * /usr/local/bin/ea-php83 /home/devcente/CenterPoint-Ecommerce/backend/artisan schedule:run >> /dev/null 2>&1
```

### Cron 2: Queue Worker (Every 2 Minutes)
Processes emails, webhooks, invoice generation, and audit logging asynchronously:
```bash
*/2 * * * * /usr/local/bin/ea-php83 /home/devcente/CenterPoint-Ecommerce/backend/artisan queue:work --stop-when-empty --tries=3 --timeout=90 >> /dev/null 2>&1
```

---

## 8. Verification & Post-Deployment Checklist

After running `bash deploy.sh`, test each endpoint:

1. **Backend API Gateway:**
   ```bash
   curl -I https://api.centerpoint.devcenterpoint.com/api/v1/health
   # Expected: HTTP/2 200 OK
   ```
2. **Main Product Website:**
   Visit `https://centerpoint.devcenterpoint.com`. Test responsiveness and registration.
3. **Merchant Studio:**
   Visit `https://studio.centerpoint.devcenterpoint.com`. Test login:
   - Email: `merchant@centerpoint.atelier`
   - Password: `password123`
4. **Master Control Panel:**
   Visit `https://control.centerpoint.devcenterpoint.com`. Test superadmin login:
   - Email: `superadmin@centerpoint.com`
   - Password: `password123`
5. **Tenant Storefront:**
   Visit `https://fashionhouse.shops.devcenterpoint.com`. Verify tenant dynamic routing.
