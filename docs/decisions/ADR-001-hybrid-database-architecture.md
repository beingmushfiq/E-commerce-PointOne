# ADR-001: Hybrid Database Architecture (Central Platform vs Isolated Tenant Databases)

## Status
Accepted

## Context
CENTERPOINT requires multi-tenant SaaS capabilities supporting thousands of independent commerce stores, alongside the commercial requirement to package standalone editions for on-premise licensing. In an e-commerce platform, cross-tenant data leakage (such as exposing another tenant's customer order, pricing strategy, or supplier details) constitutes a catastrophic privacy and compliance failure. 

We evaluated three potential tenancy models:
1. **Single Database with Discriminator (`tenant_id` column on all tables):** Fragile; relies strictly on developer discipline and global scopes; a single missed query leaks cross-tenant records; backups and exports of individual stores are complex.
2. **Schema-based Multi-tenancy (PostgreSQL schemas):** Strong, but limits deployment to PostgreSQL, conflicting with our cPanel / MySQL operational compatibility requirements.
3. **Hybrid Database Architecture (Separate MySQL Database per Tenant + One Central Database):** Complete physical separation of customer, product, order, and accounting data; trivial individual store backups and exports; simplifies compliance; supports custom schemas or version pinning for enterprise tenants.

## Decision
We adopt a **Hybrid Database Architecture**:
- **Central Database:** Holds platform identity (`platform_admins`), tenant registration (`tenants`), domain mappings (`tenant_domains`), database connection credentials (`tenant_database_configs`), billing plans (`plans`), subscriptions (`subscriptions`), invoices (`invoices`), and platform audit metadata.
- **Tenant Databases:** Each tenant has an independent database containing operational commerce tables (`products`, `variants`, `inventory`, `orders`, `customers`, `chart_of_accounts`, `journal_entries`, `cms`).
- **Dynamic Context Switching:** Incoming requests resolve the tenant by domain/host header against the central registry and dynamically configure the tenant database connection (`tenant`).

## Consequences
- **Positive:**
  - Absolute data isolation; accidental cross-tenant SQL joins are physically impossible.
  - Granular tenant backups and restores without locking or dumping other tenants.
  - Seamless migration path for a tenant to transition from hosted SaaS to an independent standalone server.
- **Negative:**
  - Running schema migrations across hundreds of tenant databases requires batched, resilient queued migration jobs.
  - Connection pooling and connection limits on shared MySQL servers must be managed carefully.

