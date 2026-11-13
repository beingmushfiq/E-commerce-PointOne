# CENTERPOINT — Repository Discovery & Audit (Phase 0)

## 1. Executive Summary
This document captures the baseline state of the `E-commerce-PointOne` repository prior to the architectural evolution into the CENTERPOINT commerce ecosystem.

The repository is currently an early-stage, functioning proof-of-concept e-commerce application built on Laravel 13 (PHP 8.3+) and React 19 (Vite 8.x, TailwindCSS v4, TanStack Query v5). While it contains seeded catalogs and interactive storefront and admin prototypes, it lacks enterprise multi-tenancy, strict authorization boundaries, an immutable inventory ledger, double-entry accounting, provider-grade payment/courier abstractions, and security-isolated CMS execution.

---

## 2. Technology Stack Verification

### Backend (Laravel 13 API)
- **Framework:** Laravel Framework `^13.8` (PHP `^8.3`)
- **Authentication:** Laravel Sanctum `^4.0`
- **Database Engine:** SQLite (local dev/test) configured via `database/database.sqlite`, with MySQL production driver configured in `config/database.php`
- **Queue/Jobs:** Database queue driver configured via `0001_01_01_000002_create_jobs_table.php`
- **Cache:** Database cache driver configured via `0001_01_01_000001_create_cache_table.php`
- **Testing:** PHPUnit `^12.5.12`, Mockery `^1.6`
- **Code Standards:** Laravel Pint `^1.27`

### Frontend (React 19 SPA)
- **Runtime & Bundler:** React `^19.2.8`, Vite `^8.2.0`, TypeScript `~6.0.2`
- **Styling:** Tailwind CSS `^4.3.3`, `@tailwindcss/vite`
- **State & Caching:** `@tanstack/react-query` `^5.101.4`
- **Routing:** `react-router-dom` `^7.18.2` (Present in dependencies, but `App.tsx` currently acts as a monolithic single-page toggle between Storefront and Admin Studio)
- **Animation & Motion:** `framer-motion` `^12.43.0`
- **Icons & UI:** `lucide-react` `^1.28.0`, `clsx`, `tailwind-merge`
- **Forms & Validation:** `react-hook-form` `^7.84.0`, `zod` `^4.6.7`, `@hookform/resolvers`
- **Charts:** `chart.js` `^4.5.1`, `react-chartjs-2` `^5.3.1`
- **Internationalization:** `i18next` `^26.3.6`, `react-i18next` `^17.0.11`
- **Linter:** `oxlint` `^1.75.0`

---

## 3. Structural & Architectural Audit

### 3.1 Backend Application (`backend/`)
- **Routing (`routes/api.php`):**
  - All endpoints are nested under `/api/v1`.
  - Public routes cover marketing (coupons, flash sales), cart/checkout, catalog (products, categories), CMS (sliders, menus, pages, blogs, faqs), and auth (register, login).
  - Protected routes (`auth:sanctum`) include customer addresses, wallet, wishlist, support tickets, inventory (warehouses, stocks, suppliers, purchase orders), and admin analytics/logs/health.
  - **Critical Flaw:** No role or permission authorization middleware protects the admin analytics or inventory endpoints. Any customer with a valid Sanctum token can query and mutate inventory and view admin KPIs.

- **Controllers (`app/Http/Controllers/Api/V1/`):**
  - `AdminDashboardController.php`: Computes KPIs via direct Eloquent aggregates. Hardcodes service health checks (`redis => 'ok'`, `storage => 'ok'`).
  - `AuthController.php`: Implements registration, login, and user profile endpoints. Always assigns the `customer` role on register.
  - `CatalogController.php`: Handles categories and product listings with basic filters.
  - `CheckoutController.php`: Handles cart operations and checkout processing.
  - `CmsController.php`: Delivers sliders, menus, pages, blog posts, and FAQs.
  - `CustomerController.php`: Manages user addresses, wallet balance/points, wishlists, and support tickets.
  - `InventoryController.php`: Manages warehouses, stock views, suppliers, and purchase orders.
  - `MarketingController.php`: Handles coupon calculation, flash sales, and newsletter subscriptions.

- **Services (`app/Services/`):**
  - `PaymentService.php`: Rudimentary mock router. Handles `cod` (returns pending) and `wallet` (deducts user wallet balance). Any other payment method defaults directly to `completed` with a fake transaction ID, creating a critical vulnerability.

- **RBAC (`app/Traits/HasRoles.php`):**
  - Custom polymorphic many-to-many relationship (`model_has_roles`).
  - `hasRole()` method evaluates on `$this->roles->contains('name', $role)` which relies on the loaded relation and fails if not eager loaded or if evaluated dynamically.

- **Database Migrations (`database/migrations/`):**
  - Standard user/cache/job tables.
  - `2026_08_01_053730_create_roles_and_permissions_tables.php`
  - `2026_08_01_054009_create_catalog_tables.php` (categories, brands, products, product_images, product_reviews, product_variants)
  - `2026_08_01_054155_create_cms_tables.php` (pages, sliders, menus, faqs, blog_categories, blog_posts)
  - `2026_08_01_054336_create_customer_tables.php` (user_addresses, wishlists, wallets, wallet_transactions, support_tickets, support_messages)
  - `2026_08_01_054513_create_orders_and_payments_tables.php` (orders, order_items, payments, carts, cart_items)
  - `2026_08_01_055222_create_inventory_tables.php` (warehouses, stocks, suppliers, purchase_orders, purchase_order_items)
  - `2026_08_01_055457_create_marketing_tables.php` (coupons, flash_sales, flash_sale_products, subscribers)
  - `2026_08_01_055638_create_admin_analytics_tables.php` (audit_logs, system_health_checks)

- **Database Seeders (`database/seeders/DatabaseSeeder.php`):**
  - Pre-populates default admin (`admin@gmail.com` / `12345678`), customer (`customer@centerpoint.com` / `password123`), roles/permissions, categories, brands, and 26 high-resolution luxury products.
  - **Issue:** Uses `PRAGMA foreign_keys = OFF;` which is SQLite-specific and causes syntax failures when running against MySQL.

---

### 3.2 Frontend Application (`frontend/`)
- **Structure:**
  - `src/App.tsx`: Acts as both the Storefront and the container for `StudioCMS`. State variable `viewMode` switches between views.
  - `src/components/StudioCMS.tsx`: A single 535-line component encapsulating the Admin Studio tabs (Products Inventory, Categories, CMS & Sliders, Analytics, Settings).
  - `src/components/DesignSystem.tsx`: Contains UI components (`EditorialButton`, `EditorialProductCard`, `CartDrawer`, `CommandPalette`).
  - `src/contexts/AuthContext.tsx`: Provides React context for user state and Sanctum token handling.
  - `src/services/api.ts`: Central Axios instance targeting `/api/v1` with Bearer token injection.
- **Architectural Observations:**
  - No physical routing separation between customer storefront, tenant management, and platform admin.
  - Lacks PWA service workers and manifests.
  - Lacks server-side rendering (SSR) or pre-rendering, creating potential search engine crawlability and OpenGraph preview bottlenecks.

