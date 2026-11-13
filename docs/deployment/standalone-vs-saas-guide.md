# CENTERPOINT — Standalone Edition vs. SaaS Edition Architectural & Operational Guide

## 1. Executive Architecture Summary

CENTERPOINT is architected from the foundation up as a **Dual-Edition Commerce Platform**. 

Tenancy is treated as an **optional deployment capability**, not a hard-coded constraint embedded in commerce domain models. This architectural decoupling ensures that CENTERPOINT can be commercially deployed in two fundamentally different models using a single unified codebase:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTERPOINT Unified Codebase                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  CENTERPOINT Standalone      │          │  CENTERPOINT SaaS Edition    │
│  Commercial Edition          │          │  Multi-Tenant Platform       │
├──────────────────────────────┤          ├──────────────────────────────┤
│ • Single Business / Single DB│          │ • Central Platform DB        │
│ • Zero SaaS Dependencies     │          │ • Dedicated Tenant DBs       │
│ • cPanel / Shared Hosting OK │          │ • Master Control Panel (MCP) │
│ • Database Queue & Cache     │          │ • Subscription Billing & SMS │
│ • Complete Management Studio │          │ • Dynamic Domain Routing     │
│ • Full Storefront & CMS      │          │ • Redis Queues & Workers     │
└──────────────────────────────┘          └──────────────────────────────┘
```

---

## 2. Comparison Matrix

| Capability / Trait | Standalone Edition | SaaS Multi-Tenant Edition |
|---|---|---|
| **Primary Target Market** | Independent Brands, Wholesalers, Commercial Licensees | Multi-Merchant Platforms, E-Commerce Enablers |
| **Hosting Requirements** | cPanel Shared Hosting, Single VPS, On-Premise | Cloud VPS, AWS, DigitalOcean, Docker, Kubernetes |
| **Database Topology** | Single Database (`mysql` or `sqlite`) | Hybrid: Central DB + Separate DB per Tenant |
| **Data Isolation** | Complete physical server or DB isolation | Strict database-level isolation enforced by `ResolveTenant` |
| **Background Processing** | Database Queue with cron (`queue:work --stop-when-empty`) | Redis Queue with long-running Supervisord / Horizon workers |
| **Caching & Sessions** | Database or file-based cache | Redis cluster / Redis Sentinel |
| **Master Control Panel (MCP)** | Disabled / Bypassed | Enabled (`/api/v1/platform/*` & Master Dashboard) |
| **Tenant Provisioning** | Manual or pre-configured installer | Automated via `TenantProvisioner` & Stripe/bKash billing |
| **Billing & Subscriptions** | None (Single owner owns all data) | Automated recurring billing, plan limits, feature toggles |
| **Custom Code Security** | Sandboxed iframe + CSP | Sandboxed iframe + CSP + strict origin separation |

---

## 3. Configuration & Environment Switching

The deployment edition is controlled by the single environment variable `CENTERPOINT_EDITION`:

### Standalone Environment (`.env`)
```env
# Edition Toggle
CENTERPOINT_EDITION=standalone

# Hosting Profile
CPANEL_MODE=true
CPANEL_FORCE_DB_QUEUE=true
CPANEL_FORCE_DB_CACHE=true

# Single Commerce Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=centerpoint_commerce
DB_USERNAME=centerpoint_user
DB_PASSWORD=secure_password

# Database Queue & Cache Fallbacks
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

### SaaS Multi-Tenant Environment (`.env`)
```env
# Edition Toggle
CENTERPOINT_EDITION=saas

# Central Database (Tenant Registry & Billing)
CENTRAL_DB_CONNECTION=central
DB_CONNECTION=central
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=centerpoint_central
DB_USERNAME=platform_admin
DB_PASSWORD=central_secure_password

# Tenant Database Connection Template
TENANT_DB_CONNECTION=tenant

# Domain Resolution
TENANT_DOMAIN_SUFFIX=centerpoint.test
CENTRAL_DOMAIN=platform.centerpoint.test

# High-Performance Infrastructure
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 4. Architectural Decoupling: How It Works Internally

### 1. The `EditionManager` Contract
Every service, controller, and middleware queries `App\Edition\EditionManager`:
- `isStandalone()`: Returns `true` when `CENTERPOINT_EDITION === 'standalone'`.
- `isSaaS()`: Returns `true` when `CENTERPOINT_EDITION === 'saas'`.

### 2. Tenant Resolution Bypass
When running in Standalone mode:
- The `ResolveTenant` middleware immediately returns `$next($request)` without executing any database lookups.
- The `EnsureTenantIsActive` and `RequireTenantContext` middleware treat the single installation as always active and valid.
- The standard Laravel default database connection (`DB_CONNECTION`) is used directly by all commerce models (`Product`, `Order`, `Customer`, `JournalEntry`).

### 3. Central vs. Tenant Model Decoupling
- **Commerce Models** (`App\Models\*`) never reference `Tenant` or central tables.
- **Central Platform Models** (`App\Models\Central\*`) are strictly partitioned to the `central` connection via `protected $connection = 'central';`.
- This ensures that if the central schema is never migrated on a standalone installation, no SQL errors or table-not-found exceptions can occur.

---

## 5. Commercial Licensing & Distribution Strategy

1. **Standalone Commercial License (One-time or Annual License Fee):**
   - Packaged via `bin/package-release.sh standalone <version>` or `bin/package-release.ps1 -Edition standalone`.
   - Delivered as a zip archive containing the pre-compiled frontend, production vendor dependencies, and cPanel deployment script.
   - Ideal for clients demanding full ownership of their data, on-premise installation, or compliance with proprietary corporate IT governance.

2. **Hosted Multi-Tenant SaaS Subscription (Monthly / Annual Recurring Revenue):**
   - Packaged via `bin/package-release.sh saas <version>`.
   - Deployed on scalable cloud VPS / Kubernetes infrastructure.
   - Customers register online, choose a tier (e.g. Starter, Growth, Enterprise), receive their dedicated store domain (or custom domain), and are provisioned automatically.

