# ADR-002: Dual-Edition Architecture (SaaS & Standalone Deployment Profiles)

## Status
Accepted

## Context
CENTERPOINT has two distinct commercial objectives:
1. **Hosted Multi-Tenant SaaS:** An operational cloud service operated by CENTERPOINT where merchants sign up, subscribe to plans, and operate stores.
2. **Commercial Standalone Edition:** A self-contained, licensed source-code product sold to enterprises or merchants who run on their own cPanel/VPS servers without any connection to CENTERPOINT's hosted infrastructure or central database.

If tenancy logic is hard-coded into every model or controller, building a standalone distribution requires maintaining two divergent codebases (which causes immediate divergence and maintenance paralysis) or artificially simulating central SaaS infrastructure on standalone customer machines.

## Decision
We decouple tenancy into an optional deployment capability:
- Implement an `EditionManager` service governed by `config('centerpoint.edition')`.
- The platform supports two runtime modes:
  - `saas`: Ingress triggers `ResolveTenant` middleware, checks central plans and entitlements, and routes to the dynamic tenant DB.
  - `standalone`: The application boots with a single default database connection (`default`), bypasses central tenant resolution, grants all licensed module entitlements, and runs the Management Studio without the SaaS Master Control Panel.
- Core commerce domains (Catalog, Orders, Inventory, Accounting, CMS, AI, Marketing) must **never** import or depend on central SaaS models (`Tenant`, `Subscription`, `Plan`, `Invoice`).

## Consequences
- **Positive:**
  - One single codebase powers both commercial products.
  - Standalone customers enjoy a zero-dependency, self-contained architecture with no phone-home or SaaS lock-in.
  - Simplifies local development and testing, allowing developers to test core commerce features in standalone mode on SQLite.
- **Negative:**
  - Features must be checked via entitlement/capability interfaces rather than direct plan table queries.

