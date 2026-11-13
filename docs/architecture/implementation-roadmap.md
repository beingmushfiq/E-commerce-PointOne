# CENTERPOINT Implementation Roadmap & Execution Sequence

```mermaid
gantt
    title CENTERPOINT Engineering Roadmap (Completed & Verified)
    dateFormat  YYYY-MM-DD
    section Discovery & Foundations
    Phase 0: Discovery, Audit & ADRs       :done,    p0, 2026-11-13, 2026-11-14
    Phase 1: Dual-Edition & Hybrid Tenancy :done,    p1, 2026-11-14, 2026-11-18
    section Core Commerce & Financials
    Phase 2: Catalog Matrix & Stock Ledger :done,    p2, 2026-11-18, 2026-11-22
    Phase 3: Payment & Courier Abstraction :done,    p3, 2026-11-22, 2026-11-26
    Phase 4: Double-Entry Accounting       :done,    p4, 2026-11-26, 2026-11-30
    section Experience & Operations
    Phase 5: Storefront CMS & Page Builder :done,    p5, 2026-11-30, 2026-12-04
    Phase 6: Master Control Panel (SaaS)   :done,    p6, 2026-12-04, 2026-12-08
    Phase 7: Local-First AI Assistant      :done,    p7, 2026-12-08, 2026-12-12
    Phase 8: Marketing, Attribution & CAPI :done,    p8, 2026-12-12, 2026-12-16
    Phase 9: PWA, SSR Pre-render & SEO     :done,    p9, 2026-12-16, 2026-12-20
    section Hardening & Release
    Phase 10: Security, cPanel & Release   :done,    p10, 2026-12-20, 2026-12-24
```

---

## Phase-by-Phase Execution Plan

### Phase 0: Discovery & Architecture Blueprint (COMPLETED)
- Repository audit & technology stack verification.
- Security assessment & vulnerability register (`docs/architecture/security-assessment.md`).
- Target architecture & database schemas (`docs/architecture/database-architecture.md`).
- Technical debt register (`docs/architecture/technical-debt.md`).
- Architecture Decision Records (ADR-001 through ADR-007 in `docs/decisions/`).

### Phase 1: Architectural Foundation & Tenancy Decoupling (COMPLETED & VERIFIED)
- **Task 1.1:** Build `EditionManager` supporting `saas` and `standalone` deployment profiles.
- **Task 1.2:** Implement Central Database migrations (`tenants`, `tenant_domains`, `plans`, `subscriptions`, `platform_admins`).
- **Task 1.3:** Build dynamic `TenantManager` and `ResolveTenant` middleware for host/domain-based database connection routing.
- **Task 1.4:** Partition authentication into 3 distinct guards (`platform`, `staff`, `customer`).
- **Task 1.5:** Implement comprehensive granular RBAC and resolve SEC-01 broken access control.
- **Task 1.6:** Implement idempotent `TenantProvisioner` workflow.

### Phase 2: Advanced Catalog & Inventory Movement Ledger (COMPLETED & VERIFIED)
- **Task 2.1:** Implement variable product models, variants, and attribute matrix.
- **Task 2.2:** Re-architect inventory into an immutable `stock_movements` ledger with warehouse isolation.
- **Task 2.3:** Implement `StockReservationService` with pessimistic database locking (`SELECT ... FOR UPDATE`) to prevent overselling race conditions (SEC-05).
- **Task 2.4:** Build strict `OrderStateMachine` with snapshot-backed `order_items`.

### Phase 3: Payment & Delivery Abstraction Layer (COMPLETED & VERIFIED)
- **Task 3.1:** Create unified `PaymentGatewayContract` and eliminate the SEC-02 payment simulation vulnerability.
- **Task 3.2:** Build adapters for Bangladesh gateways: bKash, SSLCommerz, Nagad, and Cash on Delivery.
- **Task 3.3:** Create `CourierProviderContract` and build adapters for Steadfast, Pathao, RedX, and self-managed delivery fleets.
- **Task 3.4:** Implement secure, idempotent webhook listeners with signature verification and replay protection.

### Phase 4: Double-Entry Accounting Engine (COMPLETED & VERIFIED)
- **Task 4.1:** Build Standard Chart of Accounts (Assets, Liabilities, Equity, Revenue, COGS, Expenses).
- **Task 4.2:** Implement `JournalEntry` and `JournalEntryLine` models with zero-balance invariant checks ($\sum \text{debits} == \sum \text{credits}$).
- **Task 4.3:** Automate journal postings triggered by order payment, shipment, supplier receipt, and customer refunds.
- **Task 4.4:** Build database-backed financial reports (Balance Sheet, Profit & Loss, Trial Balance, Accounts Receivable/Payable Aging).

### Phase 5: Storefront CMS & Visual Page Builder (COMPLETED & VERIFIED)
- **Task 5.1:** Design JSON page schema with reusable sections (Hero, Featured Collection, Product Carousel, Testimonials, FAQ).
- **Task 5.2:** Build drag-and-drop section manager in Management Studio.
- **Task 5.3:** Implement sandboxed iframe rendering with strict CSP for tenant custom HTML/CSS/JS (SEC-04).
- **Task 5.4:** Implement multi-theme token system (typography, color palettes, spacing).

### Phase 6: SaaS Master Control Panel (COMPLETED & VERIFIED)
- **Task 6.1:** Build platform administrative UI for platform operators.
- **Task 6.2:** Real database KPI queries (MRR, ARR, churn, active tenants, storage usage).
- **Task 6.3:** Tenant lifecycle management (creation, onboarding, suspension, archival, export).
- **Task 6.4:** Plan limits and entitlement enforcement engine.

### Phase 7: Local-First AI Assistant (COMPLETED & VERIFIED)
- **Task 7.1:** Build rule-based intent classifier with Bangla and English language handling.
- **Task 7.2:** Catalog and store knowledge base full-text retrieval system.
- **Task 7.3:** Build tenant AI business assistant for authorized staff (read-only reporting queries).
- **Task 7.4:** Implement optional LLM provider adapters (OpenAI, Gemini, Anthropic) with encrypted API credentials at rest.

### Phase 8: Digital Marketing, Attribution & CAPI (COMPLETED & VERIFIED)
- **Task 8.1:** Build canonical e-commerce event dispatcher (`PageView`, `ViewContent`, `AddToCart`, `BeginCheckout`, `Purchase`).
- **Task 8.2:** Implement Meta Pixel + Conversions API (CAPI) with browser/server deduplication (`event_id`) and customer data hashing.
- **Task 8.3:** Implement GA4 & Google Ads Enhanced Conversions with Google Consent Mode v2.
- **Task 8.4:** Build first-party UTM and click identifier attribution engine (`gclid`, `fbclid`).
- **Task 8.5:** Implement automated product feeds for Google Merchant Center and Meta Commerce.

### Phase 9: PWA, SSR & Search Engine Optimization (COMPLETED & VERIFIED)
- **Task 9.1:** Build dual installable PWA experiences (Customer Storefront PWA and Management Studio PWA).
- **Task 9.2:** Evaluate and implement pre-rendering / SSR for dynamic product indexing and social card previews.
- **Task 9.3:** Automated Schema.org JSON-LD generation (`Product`, `Offer`, `BreadcrumbList`, `OnlineStore`).
- **Task 9.4:** Tenant SEO control center (meta titles, sitemaps, robots.txt, 301 redirects).

### Phase 10: Production Hardening & Commercial Release (COMPLETED & VERIFIED)
- **Task 10.1:** cPanel compatibility validation (MySQL, database queues, cron workers).
- **Task 10.2:** Automated tenant boundary leak test suite.
- **Task 10.3:** Build commercial distribution packages:
  - CENTERPOINT SaaS (Hosted)
  - CENTERPOINT Enterprise (Dedicated)
  - CENTERPOINT Source Edition (Independent standalone commercial licensing)
- **Task 10.4:** Complete production documentation and runbooks.

