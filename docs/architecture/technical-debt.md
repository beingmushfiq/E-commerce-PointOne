# Technical Debt & Codebase Flaws Register (Phase 0 Audit)

## 1. Summary of Identified Debt

This register catalogs existing architectural shortcuts, anti-patterns, and technical debt in the baseline repository that will be systematically refactored.

---

## 2. Technical Debt Items

### TD-01: Single-Page View Controller Monolith
- **Location:** `frontend/src/App.tsx`
- **Issue:** The entire application (Storefront, Command Palette, Cart Drawer, Product Inspect Modal, Checkout Modal, and Studio CMS container) is wired inside a single React component using conditional boolean rendering.
- **Consequence:** Massive bundle size, lack of code splitting, impossible to deliver independent PWA manifests, and severe maintenance friction.
- **Refactoring Strategy:** Introduce proper route separation via `react-router-dom` v7 with distinct lazy-loaded route trees for `/storefront/*`, `/admin/*`, and `/mcp/*`.

### TD-02: SQLite-Only Database Seeder
- **Location:** `backend/database/seeders/DatabaseSeeder.php`
- **Issue:** Contains `DB::statement('PRAGMA foreign_keys = OFF;');` which causes immediate syntax errors when executing against MySQL in staging/production environments.
- **Refactoring Strategy:** Detect the active database driver via `DB::connection()->getDriverName()` and use `SET FOREIGN_KEY_CHECKS=0;` for MySQL or `PRAGMA foreign_keys = OFF;` for SQLite.

### TD-03: Floating-Point Financial Arithmetic
- **Location:** `backend/app/Http/Controllers/Api/V1/CheckoutController.php`, `MarketingController.php`
- **Issue:** Monetary discounts, subtotals, and taxes use standard PHP binary floating-point (`float` / `double`) calculations.
- **Consequence:** Inherent rounding errors and balance mismatches across large transaction volumes.
- **Refactoring Strategy:** Enforce decimal-safe arithmetic using string operations or `brick/money` across all price and financial ledger calculations.

### TD-04: Rigid RBAC Trait Evaluation
- **Location:** `backend/app/Traits/HasRoles.php`
- **Issue:** `$this->roles->contains('name', $role)` evaluates only the in-memory loaded Eloquent collection. If the relation is not eager-loaded, it can produce silent false negatives.
- **Refactoring Strategy:** Replace with robust database-backed role/permission checks and integrate Laravel Policies.

### TD-05: Missing Order Lifecycle Snapshotting
- **Location:** `backend/app/Http/Controllers/Api/V1/CheckoutController.php`
- **Issue:** Orders link directly to products without capturing immutable historical snapshots of product name, SKU, tax rate, and shipping properties at the instant of purchase.
- **Consequence:** If a product is edited or renamed later, previous order records inadvertently reflect the updated attributes.
- **Refactoring Strategy:** Store immutable JSON snapshot payloads on each `order_items` record.

### TD-06: Hardcoded cPanel & Environment Assumptions
- **Location:** `backend/config/`
- **Issue:** System configurations assume modern cloud infrastructure (persistent queue listeners, Redis caching) without built-in graceful degradation mechanisms for shared cPanel hosting.
- **Refactoring Strategy:** Implement dynamic infrastructure capability detection with database-queue fallbacks and cron-driven job workers.

