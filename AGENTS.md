# AGENTS.md — Working Protocol & Memory for CENTERPOINT

## 1. Project Mission & Identity
**Project:** CENTERPOINT — Flagship E-commerce SaaS & Standalone Platform  
**Repository:** `E-commerce-PointOne`  
**Current Phase:** Phase 0 (Discovery, Audit & Architecture Blueprint)  
**Primary Goal:** Transform an existing Laravel 13 / React 19 proof-of-concept into a dual-edition, production-grade commerce ecosystem (Multi-Tenant SaaS + Standalone Commercial Edition) optimized for cPanel/VPS/Cloud environments and the Bangladesh / global retail and wholesale market.

---

## 2. Core Non-Negotiable Operational Principles

1. **Dual-Edition Decoupling:**
   - Multi-tenant SaaS is an optional deployment capability, *not* hard-baked in every model.
   - The platform must run completely standalone (single customer, single DB, zero SaaS dependency) or multi-tenant SaaS (central platform DB + dedicated tenant DBs).
   - Never couple core commerce logic to Master Control Panel models.

2. **Zero Code Execution during Architectural Planning:**
   - Always document, plan, and obtain architectural alignment before touching application code.
   - Ground truth first: verify existing schema, routes, configurations, and packages prior to any refactoring.

3. **No Artificial Implementations:**
   - Never fabricate analytics, inventory numbers, payment confirmations, or mock operational statistics in production code.
   - Never mark an integration as complete without a verifiable, testable contract and server-side verification.
   - Sandbox/test adapters must be explicitly demarcated.

4. **Security & Boundary Isolation:**
   - Three distinct auth guards: Platform Admins (`platform`), Tenant Staff (`staff`), Store Customers (`customer`).
   - Tenant context must be resolved from trusted domain/host mapping before accessing tenant databases. Never trust client-supplied tenant headers or query parameters for authorization.
   - Sandboxed iframe + strict CSP for all tenant custom HTML/CSS/JS.

5. **Financial & Inventory Integrity:**
   - Pure double-entry accounting: every posted journal entry must satisfy `SUM(debits) == SUM(credits)`.
   - Immutable transaction ledger: no direct updates to posted financial entries; corrections require reversal entries.
   - Use decimal-safe math (`brick/money` or exact decimal strings) for financial calculations. Never use binary floating-point.
   - Pessimistic locking / database transactions on stock reservations to eliminate race conditions and overselling.

---

## 3. Directory Layout & Knowledge Base

- `docs/architecture/`: Core architectural blueprints, audits, security assessments, and roadmaps.
- `docs/decisions/`: Architecture Decision Records (ADRs).
- `docs/modules/`: Deep dives into domain modules (Catalog, Orders, Inventory, Accounting, Marketing, Tenancy, CMS).
- `docs/security/`: Threat modeling, vulnerability registers, and compliance guides.
- `docs/deployment/`: cPanel, VPS, Docker, and standalone licensing deployment guides.

---

## 4. Agent Working Workflow

When executing any task:
1. **Discover & Inspect:** Check existing code and ADRs before making assumptions.
2. **Design with Verification:** Define unit/feature test requirements before code changes.
3. **Run Checks:** Validate linting, type-checks, tests, and database migrations.
4. **Update Registers:** Maintain `docs/architecture/feature-inventory.md` with honest statuses (`Implemented & Verified`, `Partially Implemented`, `Not Implemented`).

