# Target Architecture — CENTERPOINT Commerce Platform

## 1. Architectural Vision & Core Paradigms

CENTERPOINT is structured as a **modular commerce engine** where SaaS tenancy is an optional deployment capability, not an inescapable dependency.

```mermaid
graph TD
    Client["Clients & Touchpoints"]
    
    subgraph UI ["Multi-Experience Frontend Layer"]
        StorefrontPWA["Storefront PWA (React 19 / Vite)"]
        StudioPWA["Tenant Management Studio PWA"]
        MasterCP["Master Control Panel (Platform Operations)"]
    end

    subgraph Ingress ["API Routing & Security Perimeter"]
        TenantResolver["Tenant Resolution Middleware (Domain / Host Header)"]
        GuardRouter["Multi-Guard Authenticator (Platform / Staff / Customer)"]
        RateLimiter["Adaptive Rate Limiting & Audit Interceptor"]
    end

    subgraph EditionMgr ["Edition Abstraction Layer"]
        Edition["Edition Manager (SaaS vs Standalone)"]
    end

    subgraph CoreEngine ["Modular Monolith Domain Core"]
        CatalogDomain["Catalog & Product Matrix"]
        OrderDomain["Order Lifecycle State Machine"]
        InventoryDomain["Inventory & Stock Ledger"]
        AccountingDomain["Double-Entry Accounting Engine"]
        CMSDomain["Visual Page Builder & Sandboxed CMS"]
        AIDomain["Local-First AI Engine & Retrieval"]
        MarketingDomain["Marketing, Attribution & CAPI Dispatcher"]
    end

    subgraph Persistence ["Hybrid Database Topology"]
        CentralDB[("Central Database (Platform, Plans, Billing, Registry)")]
        TenantDB1[("Tenant Database A (Catalog, Orders, Ledger)")]
        TenantDB2[("Tenant Database B (Catalog, Orders, Ledger)")]
        TenantDBN[("Tenant Database N (Catalog, Orders, Ledger)")]
    end

    Client --> UI
    StorefrontPWA --> Ingress
    StudioPWA --> Ingress
    MasterCP --> Ingress
    Ingress --> EditionMgr
    EditionMgr --> CoreEngine
    
    MasterCP -.->|Manages| CentralDB
    CoreEngine -->|Central Context| CentralDB
    CoreEngine -->|Dynamic Tenant Context| TenantDB1
    CoreEngine -->|Dynamic Tenant Context| TenantDB2
    CoreEngine -->|Dynamic Tenant Context| TenantDBN
```

---

## 2. Dual-Edition Deployment Profiles

### 2.1 CENTERPOINT SaaS Edition
- **Target:** Hosted multi-tenant platform.
- **Topology:**
  - One **Central Database**: Manages platform administrators, tenant registry, domain mappings, subscription plans, usage meters, billing invoices, and platform audit logs.
  - Dynamic **Tenant Databases**: Each tenant operates in an isolated MySQL database containing their customers, products, orders, inventory, accounting, and CMS.
  - **Master Control Panel:** Administrative interface for platform operators.

### 2.2 CENTERPOINT Standalone Edition
- **Target:** Single-business commercial licensing (on-premise or independent cloud/cPanel hosting).
- **Topology:**
  - Single independent database containing the complete commerce engine.
  - Zero dependency on external platform controllers, remote licensing servers, or central billing.
  - Dedicated Management Studio for tenant owners.

---

## 3. Bounded Contexts & Domain Architecture

```mermaid
classDiagram
    class TenancyDomain {
        +TenantManager
        +TenantContext
        +DomainResolver
        +ProvisioningService
    }
    class CatalogDomain {
        +Product
        +ProductVariant
        +ProductAttribute
        +Collection
        +PricingService
    }
    class InventoryDomain {
        +Warehouse
        +StockLevel
        +StockMovement (Ledger)
        +ReservationService
        +ValuationService (FIFO / WAC)
    }
    class OrderDomain {
        +Order
        +OrderItem (Immutable Snapshot)
        +OrderStateMachine
        +CheckoutService
    }
    class AccountingDomain {
        +ChartOfAccounts
        +JournalEntry
        +JournalEntryLine
        +GeneralLedger
        +FinancialReportService
    }
    class PaymentDomain {
        +PaymentGatewayContract
        +SSLCommerzAdapter
        +BkashAdapter
        +NagadAdapter
        +CodAdapter
    }
    class FulfillmentDomain {
        +CourierProviderContract
        +SteadfastAdapter
        +PathaoAdapter
        +RedXAdapter
    }
    class CMSDomain {
        +PageBuilder
        +ThemeEngine
        +SandboxedCodeIsolation
    }
    class MarketingDomain {
        +CanonicalEventDispatcher
        +MetaCapiAdapter
        +GA4Adapter
        +ConsentManager
        +AttributionEngine
    }
    class AIDomain {
        +IntentClassifier
        +CatalogRetrieval
        +KnowledgeBase
        +LlmProviderAdapter
    }

    OrderDomain --> InventoryDomain : Reserves Stock
    OrderDomain --> PaymentDomain : Collects Funds
    OrderDomain --> FulfillmentDomain : Dispatches Parcels
    OrderDomain --> AccountingDomain : Posts Journal Entries
    OrderDomain --> MarketingDomain : Emits Purchase Events
```

---

## 4. Key Architectural Invariants

1. **Strict Context Isolation:** Database queries, filesystem storage, cache tags, and queued jobs are explicitly scoped to the active tenant context. A job running in the queue restores the tenant's exact database connection and settings before execution.
2. **Deterministic State Transitions:** Orders, payments, stock reservations, and shipments progress exclusively through formal state machine transitions that emit domain events and maintain audit trails.
3. **Decoupled External Adapters:** All third-party providers (bKash, SSLCommerz, Steadfast, Meta CAPI, OpenAI) implement unified PHP interfaces (`*Contract`). Switching or testing providers requires zero changes to core domain logic.
4. **Sandboxed Custom Code:** Any tenant-authored JavaScript executes exclusively in an isolated `iframe` governed by restrictive Content Security Policies (`CSP`), preventing access to privileged admin tokens or customer sessions.

