# ADR-008: Domain Hierarchy, Tenant Isolation & Ingress Routing

## Status
Accepted

## Context
CENTERPOINT is a dual-edition commerce platform supporting both Standalone Commercial Edition and Multi-Tenant SaaS. In SaaS mode, the platform serves three distinct user classes:
1. Public visitors & prospective merchants (Marketing, Plans, Sign-up).
2. Merchant staff & store owners (Store Studio & Visual CMS).
3. Platform operators & Superadmins (Master Control Panel).
4. Storefront end-customers purchasing from individual merchant stores.

A critical security and architectural failure in multi-tenant commerce systems is hosting untrusted tenant storefronts on the same root subdomain or cookie domain as privileged administrative portals. If tenant storefronts share a parent cookie domain with the admin console, vulnerabilities in custom HTML/JS or session cookies can compromise merchant accounts. Furthermore, brand clarity requires separating the creator company (`DevCenterPoint`) from the SaaS flagship (`CENTERPOINT`).

## Decision

### 1. Unified Domain Hierarchy
We adopt a multi-tier domain architecture rooted in `devcenterpoint.com`:

| Hostname | Tier / Role | Target Application | TLS / SSL Strategy |
| :--- | :--- | :--- | :--- |
| `centerpoint.devcenterpoint.com` | Platform Marketing & Ingress | Landing Page, Features, Pricing & Tenant Onboarding | Dedicated SAN Certificate |
| `{store}.shops.devcenterpoint.com` | Customer Storefronts | Multi-Tenant Customer Experience & Checkout | Wildcard `*.shops.devcenterpoint.com` |
| `studio.centerpoint.devcenterpoint.com` | Merchant Workspace | Store Studio, Analytics, Accounting & Visual CMS | Dedicated SAN Certificate |
| `control.centerpoint.devcenterpoint.com` | Platform Governance | Master Control Panel (SaaS Fleet, Provisioning) | Dedicated SAN Certificate + IP Allowlist |
| `api.centerpoint.devcenterpoint.com` | Backend API Gateway | Laravel 13 Core REST API Engine | Dedicated SAN Certificate |
| `docs.centerpoint.devcenterpoint.com` | Knowledge Base | Technical Docs, Guides, API References | Dedicated SAN Certificate |
| `status.centerpoint.devcenterpoint.com` | System Telemetry | Real-time Uptime, Cluster Health & Incidents | Dedicated SAN Certificate |
| `staging.centerpoint.devcenterpoint.com` | Staging Environment | Pre-production validation cluster | Dedicated SAN Certificate |
| `{custom-domain.com}` | Branded Storefronts | Custom merchant domain (e.g. `www.fashionhouse.com`) | Automated Let's Encrypt / Cloudflare SSL |

### 2. Isolation & Cookie Security Boundary
- **Tenant Isolation:** Tenant storefronts live strictly under `*.shops.devcenterpoint.com`. Because modern browsers enforce cookie domain boundaries, cookies set on `*.shops.devcenterpoint.com` can never be read or overwritten by `studio.centerpoint.devcenterpoint.com` or `control.centerpoint.devcenterpoint.com`.
- **Administrative Hardening:** The Master Control Panel (`control.centerpoint.devcenterpoint.com`) is isolated from merchant studio traffic, enabling strict Cloudflare Access / WAF rules, mTLS, or VPN IP restrictions without interfering with merchant operations.

### 3. Tenant Resolution & Anti-Spoofing Rules
- **Trusted Host Resolution Only:** Tenant identification must be derived exclusively from the trusted HTTP `Host` header verified by the reverse proxy. Client-supplied headers (e.g. `X-Tenant-ID`, `X-Shop-Slug`) are strictly forbidden for authorization.
- **Central Domain Cache:** In SaaS mode, verified hostnames are resolved via `central.tenant_domains` with an in-memory Redis cache (`tenant_domain:{host}`). Unrecognized domains receive an immediate HTTP 404.
- **Reserved Slug Protection:** The registration engine enforces an immutable blacklist of reserved slugs (`admin`, `studio`, `control`, `api`, `shops`, `billing`, `support`, `status`, `auth`, `app`, `cdn`, `mail`, `dev`, `staging`, `test`).

## Consequences

### Positive
- **Rock-Solid Security:** Clean blast-radius isolation between customer shopping sessions, merchant backoffices, and platform superadmin consoles.
- **Simplified SSL Provisioning:** A single wildcard certificate (`*.shops.devcenterpoint.com`) covers all standard tenant storefronts without per-tenant certificate provisioning.
- **Brand Prestige:** Clearly showcases `CENTERPOINT` as the premier commerce engine while crediting `DevCenterPoint` as its creator.
- **Custom Domain Flexibility:** Merchants can start with `store.shops.devcenterpoint.com` and seamlessly bind custom apex/subdomains via CNAME and TXT verification.

### Negative / Trade-Offs
- Requires configuring DNS wildcard records and reverse proxy routing blocks in production (Nginx/cPanel/Cloudflare).
- Local development requires domain aliases (`/etc/hosts` or `*.shops.localhost`) or local path routing fallbacks.
