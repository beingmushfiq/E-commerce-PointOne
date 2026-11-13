# Current Architecture Snapshot

## 1. High-Level Topology

Currently, the system is designed as a single monolithic application partitioned into a Laravel 13 backend and a React 19 single-page application (SPA).

```mermaid
graph TD
    User([User / Browser])
    
    subgraph Frontend ["React 19 SPA (frontend/src)"]
        App["App.tsx (View Controller & State)"]
        StorefrontView["Storefront View"]
        StudioCMSView["StudioCMS Component (Admin Tabs)"]
        App -->|viewMode === 'storefront'| StorefrontView
        App -->|viewMode === 'cms'| StudioCMSView
    end

    subgraph Backend ["Laravel 13 REST API (backend/)"]
        Router["routes/api.php (/api/v1)"]
        Sanctum["Laravel Sanctum Auth Middleware"]
        Controllers["API Controllers (V1)"]
        Eloquent["Eloquent Models (Single DB Connection)"]
        Router --> Sanctum
        Sanctum --> Controllers
        Controllers --> Eloquent
    end

    subgraph Database ["Single Relational Database"]
        DB[("SQLite / MySQL Single Database")]
        Eloquent --> DB
    end

    User -->|HTTP / HTTPS| Frontend
    Frontend -->|JSON REST / Axios| Router
```

---

## 2. Component Boundaries & Interactions

### 2.1 Monolithic Single-Page Frontend Architecture
- **State Management:** Local React state (`useState`) handles view navigation, modals, category filters, and form values. `@tanstack/react-query` manages remote server state and caching for catalog, cart, and CMS items.
- **View Toggle:** `App.tsx` conditionally returns either the storefront layout or `StudioCMS.tsx`. There is no isolated bundle or distinct application shell for the administrative workspace.
- **Styling Architecture:** Tailwind CSS v4 is bundled via `@tailwindcss/vite` using modern CSS directives (`@theme`).

### 2.2 Backend Request Lifecycle
1. Incoming HTTP requests hit `backend/public/index.php`.
2. Laravel HTTP Kernel runs standard middleware.
3. Requests matching `/api/v1/*` are routed via `routes/api.php`.
4. Protected routes verify identity via `auth:sanctum`.
5. Controllers execute queries directly on Eloquent models referencing the primary database connection (`default`).
6. Responses return JSON envelopes formatted as `{ status: 'success'|'error', data: ... }`.

---

## 3. Data Model & Entity Relations (Current)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ USER_ADDRESSES : has
    USERS ||--o{ WALLETS : owns
    USERS ||--o{ AUDIT_LOGS : generates
    USERS }o--o{ ROLES : assigned
    ROLES }o--o{ PERMISSIONS : contains

    CATEGORIES ||--o{ PRODUCTS : categorizes
    BRANDS ||--o{ PRODUCTS : manufactures
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_IMAGES : displays
    PRODUCTS ||--o{ STOCKS : tracked_in
    WAREHOUSES ||--o{ STOCKS : stores

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : records
    CARTS ||--o{ CART_ITEMS : holds
```

---

## 4. Current Limitations & Architectural Deficits

1. **No Tenancy Abstraction:** Every table assumes single-tenant ownership. There is no concept of a tenant identifier, tenant context, or central database.
2. **Co-mingled Identity:** Customers and administrators reside in the same `users` table and share the same Sanctum authentication driver without guard isolation.
3. **Absence of Domain Layer:** Business logic is embedded directly within controllers and minimal service classes rather than decoupled domain actions and state machines.
4. **Vulnerable State Transitions:** Order statuses and inventory quantities can be mutated without transactional consistency or transition guards.

