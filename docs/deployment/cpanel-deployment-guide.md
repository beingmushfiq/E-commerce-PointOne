# CENTERPOINT — cPanel Production Deployment & Isolation Guide
**Multi-Subdomain SaaS & Standalone Hybrid Architecture**  
**Account User:** `devcente` | **Root Folder:** `/home/devcente/CenterPoint-Ecommerce`  
**Target Domain:** `devcenterpoint.com` | **Stack:** Laravel 13 (PHP 8.3) + React 19 / Vite + MySQL 8.0

> [!IMPORTANT]
> **Complete `public_html` Isolation Guarantee:**  
> This entire deployment lives strictly inside `/home/devcente/CenterPoint-Ecommerce/`.  
> It **NEVER touches, overwrites, or creates files in `/home/devcente/public_html/`**, keeping your existing live website in `public_html` completely safe and untouched.

---

## 1. Operating Filesystem Layout

All backend application files, build pipelines, and public webroots for each subdomain live entirely within `CenterPoint-Ecommerce`:

```
/home/devcente/
├── public_html/                            # [UNTOUCHED] Your existing live production website
│
└── CenterPoint-Ecommerce/                  # Isolated CENTERPOINT Application Root
    ├── backend/                            # Laravel 13 Core
    │   ├── app/
    │   ├── config/
    │   ├── database/
    │   ├── storage/
    │   ├── vendor/
    │   ├── .env                            # Active production environment
    │   ├── .env.production                 # Production environment template
    │   ├── artisan
    │   └── public/                         # Document Root: api.centerpoint.devcenterpoint.com
    │       ├── index.php                   # Native Laravel front controller
    │       ├── .htaccess                   # Apache Bearer token & rewrite rules
    │       └── storage -> ../storage/app/public
    │
    ├── frontend/                           # React 19 + Vite Frontend SPA Source
    │   ├── src/
    │   ├── dist/                           # Pre-compiled production client bundle
    │   └── .env.production
    │
    ├── webroots/                           # Subdomain Document Roots (All inside CenterPoint-Ecommerce)
    │   ├── centerpoint/                    # Document Root: centerpoint.devcenterpoint.com
    │   ├── studio/                         # Document Root: studio.centerpoint.devcenterpoint.com
    │   ├── control/                        # Document Root: control.centerpoint.devcenterpoint.com
    │   ├── shops/                          # Document Root: *.shops.devcenterpoint.com
    │   ├── docs/                           # Document Root: docs.centerpoint.devcenterpoint.com
    │   └── status/                         # Document Root: status.centerpoint.devcenterpoint.com
    │
    ├── bin/
    │   └── cpanel-deploy.sh                # Automated zero-downtime deployment engine
    ├── .cpanel.yml                         # cPanel Git Version Control deployment manifest
    └── deploy.sh                           # One-click terminal deployment wrapper
```

---

## 2. Part 1: Subdomain Creation in cPanel GUI

In **cPanel > Domains** (or **Subdomains**):

When creating each subdomain, cPanel by default suggests `public_html/subdomain`. **Clear that default** and set the **Document Root** field relative to your home directory (`/home/devcente/`) as shown below:

| No | Subdomain | Document Root to enter in cPanel | Full Server Path | Target Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `api.centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/backend/public` | `/home/devcente/CenterPoint-Ecommerce/backend/public` | Native Laravel 13 REST API Gateway |
| **2** | `centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/centerpoint` | `/home/devcente/CenterPoint-Ecommerce/webroots/centerpoint` | Main product marketing, registration & onboarding SPA |
| **3** | `studio.centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/studio` | `/home/devcente/CenterPoint-Ecommerce/webroots/studio` | Merchant administration, orders & Visual CMS SPA |
| **4** | `control.centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/control` | `/home/devcente/CenterPoint-Ecommerce/webroots/control` | Superadmin Master Control Panel (SaaS tenant manager) |
| **5** | `docs.centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/docs` | `/home/devcente/CenterPoint-Ecommerce/webroots/docs` | Developer API documentation & merchant user manuals |
| **6** | `status.centerpoint.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/status` | `/home/devcente/CenterPoint-Ecommerce/webroots/status` | Real-time system health, telemetry & incident notices |
| **7** | `*.shops.devcenterpoint.com` | `CenterPoint-Ecommerce/webroots/shops` | `/home/devcente/CenterPoint-Ecommerce/webroots/shops` | Multi-tenant customer storefronts (`{store}.shops...`) |

> [!TIP]
> For `*.shops.devcenterpoint.com` in cPanel: enter `*` in the **Subdomain** field, select `shops.devcenterpoint.com` in the domain dropdown, and set the Document Root to `CenterPoint-Ecommerce/webroots/shops`.

### 2.1 SSL / AutoSSL Certificate Issuance
1. Open **cPanel > SSL/TLS Status**.
2. Select the 7 subdomains listed above.
3. Click **Run AutoSSL**. AutoSSL will provision DV certificates.
4. *(If DNS is managed on Cloudflare)*: Set SSL mode to **Full (Strict)**, and install an Origin Certificate covering `devcenterpoint.com`, `*.devcenterpoint.com`, and `*.shops.devcenterpoint.com`.

---

## 3. Part 2: Database Configuration & Credentials

In **cPanel > MySQL® Database Wizard**:
- **Database:** `cp_central` *(or `devcente_cp_central` if your cPanel host enforces user prefixes)*
- **User:** `cp_master` *(or `devcente_cp_master`)*
- **Password:** `ko918(hTY)MiMXol`
- **Privileges:** Select **ALL PRIVILEGES** with collation `utf8mb4_unicode_ci`.

The configuration is already saved in **`backend/.env.production`**:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cp_central
DB_USERNAME=cp_master
DB_PASSWORD="ko918(hTY)MiMXol"
```

---

## 4. Part 3: cPanel Git™ Version Control Setup

### 4.1 Generate Deploy Key in cPanel Terminal
```bash
ssh-keygen -t ed25519 -C "deploy@devcenterpoint.com" -f ~/.ssh/id_ed25519_deploy -N ""
cat ~/.ssh/id_ed25519_deploy.pub
```
Add the public key as a read-only **Deploy Key** in your GitHub repository settings.

### 4.2 Initialize Git Repository in cPanel GUI
1. Navigate to **cPanel > Git™ Version Control**.
2. Click **Create**:
   - **Clone Repository:** Enabled
   - **Clone URL:** `git@github.com:your-org/E-commerce-PointOne.git`
   - **Repository Path:** `CenterPoint-Ecommerce` *(creates `/home/devcente/CenterPoint-Ecommerce`)*
   - **Repository Name:** `CenterPoint-Ecommerce`
3. Click **Create**. cPanel clones the codebase directly into `/home/devcente/CenterPoint-Ecommerce`.

### 4.3 Automated `.cpanel.yml` Hook
The repository includes `.cpanel.yml` in the root:

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

In the **cPanel Terminal**, deploy or update with one command:

```bash
cd /home/devcente/CenterPoint-Ecommerce
bash deploy.sh
```

### What [bin/cpanel-deploy.sh](file:///d:/E-commerce-PointOne/bin/cpanel-deploy.sh) executes:
1. **PHP Detection:** Selects `/usr/local/bin/ea-php83` (or `ea-php82`, `/usr/local/bin/php`).
2. **Maintenance Trap:** Graceful maintenance mode with an emergency `trap` that triggers `php artisan up` on any unexpected error to prevent downtime.
3. **Environment Setup:** Automatically copies `.env.production` into `.env` if `.env` does not exist.
4. **Composer Classmaps:** Runs `composer install --no-dev --optimize-autoloader`.
5. **Vite Compilation & Distribution:** Distributes pre-compiled React 19 assets directly into `CenterPoint-Ecommerce/webroots/{centerpoint, studio, control, shops, docs, status}`.
6. **Apache `.htaccess` Generation:** Creates mod_rewrite rules inside each webroot for React Router SPA navigation.
7. **Native API Serving:** Serves API directly from `CenterPoint-Ecommerce/backend/public`.
8. **Migrations & Storage:** Runs `php artisan migrate --force` and `php artisan storage:link`.
9. **Caches & Health Probe:** Optimizes route, config, and view classmaps, and executes an HTTP health check.

---

## 6. Part 5: cPanel Cron Configuration

In **cPanel > Cron Jobs**, configure two cron runners:

### Cron 1: Laravel Task Scheduler (Every Minute)
```bash
* * * * * /usr/local/bin/ea-php83 /home/devcente/CenterPoint-Ecommerce/backend/artisan schedule:run >> /dev/null 2>&1
```

### Cron 2: Queue Worker (Every 2 Minutes)
```bash
*/2 * * * * /usr/local/bin/ea-php83 /home/devcente/CenterPoint-Ecommerce/backend/artisan queue:work --stop-when-empty --tries=3 --timeout=90 >> /dev/null 2>&1
```

---

## 7. Verification Checklist

After running `bash deploy.sh`:

1. **Verify `public_html` is Untouched:**
   ```bash
   ls -la /home/devcente/public_html
   # Your existing website files remain completely unchanged!
   ```
2. **Backend API Gateway:**
   ```bash
   curl -I https://api.centerpoint.devcenterpoint.com/api/v1/health
   # Expected: HTTP/2 200 OK
   ```
3. **Main Product Website:**
   `https://centerpoint.devcenterpoint.com`
4. **Merchant Studio:**
   `https://studio.centerpoint.devcenterpoint.com` (merchant: `merchant@centerpoint.atelier` / `password123`)
5. **Master Control Panel:**
   `https://control.centerpoint.devcenterpoint.com` (superadmin: `superadmin@centerpoint.com` / `password123`)
6. **Tenant Storefront:**
   `https://fashionhouse.shops.devcenterpoint.com`
