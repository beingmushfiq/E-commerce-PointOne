# CENTERPOINT Feature Completion Register

> **Ground Truth Rule:** This register represents the exact operational status of features across the repository. Statuses must be updated upon passing automated verification tests.

## Status Legend
- 🟢 **Implemented & Verified:** Fully backed by data model, business logic, authorization, UI, tests, and documentation.
- 🟡 **Partially Implemented:** Exists in prototype, interface, or partial schema, but lacks full lifecycle, security, or test verification.
- 🔴 **Not Implemented:** Planned or specified, but not yet present in codebase.

---

## 1. Tenancy & Platform Governance
| Feature | Status | Notes |
|---|---|---|
| Dual-Edition Configuration (SaaS vs Standalone) | 🟢 Implemented & Verified | `App\Edition\EditionManager` unit tested |
| Hybrid Central/Tenant Database Topology | 🟢 Implemented & Verified | Central schema migrated & tested |
| Trusted Domain & Host Header Tenant Resolution | 🟢 Implemented & Verified | `App\Tenancy\TenantManager` tested |
| Idempotent Tenant Provisioner | 🟢 Implemented & Verified | `App\Tenancy\TenantProvisioner` tested |
| Tenant Context Isolation (DB, Cache, Queue, Storage) | 🟢 Implemented & Verified | Dynamic DB switcher & cache scoping verified |
| Master Control Panel UI & Operations | 🔴 Not Implemented | Target for Phase 6 |
| Plan Entitlements & Usage Enforcement | 🟡 Partially Implemented | Plan schema & `Plan::hasFeature` ready |

---

## 2. Authentication & Authorization (RBAC)
| Feature | Status | Notes |
|---|---|---|
| Sanctum API Token Authentication | 🟢 Implemented & Verified | Configured in `config/sanctum.php` |
| Customer Registration & Login | 🟢 Implemented & Verified | Endpoints in `AuthController.php` |
| Multi-Guard Separation (Platform / Staff / Customer) | 🟢 Implemented & Verified | Configured in `config/auth.php` |
| Granular Permission-Based Authorization | 🟢 Implemented & Verified | `CheckPermission` & `RequireRole` middleware |
| Protected Admin & Inventory Route Gates | 🟢 Implemented & Verified | SEC-01 remediated & verified with 403 tests |
| Two-Factor Authentication (2FA) | 🔴 Not Implemented | Target for future release |

---

## 3. Catalog & Product Matrix
| Feature | Status | Notes |
|---|---|---|
| Simple Product CRUD | 🟢 Implemented & Verified | 26 luxury seeded products |
| Department & Category Hierarchy | 🟢 Implemented & Verified | Parent-child relations in `Category.php` |
| Brand Associations | 🟢 Implemented & Verified | Linked to products via `brands` table |
| Variable Products & Attribute Matrix | 🟢 Implemented & Verified | Attributes, values, and variants linked |
| Product Bundles, Digital & Services | 🟢 Implemented & Verified | Supported via product types & collections |
| Immutable Order Item Product Snapshotting | 🟢 Implemented & Verified | `order_items.snapshot_data` tested |

---

## 4. Inventory & Warehousing
| Feature | Status | Notes |
|---|---|---|
| Warehouse Definition | 🟢 Implemented & Verified | Model and migration active |
| Movement-Based Inventory Ledger | 🟢 Implemented & Verified | `StockMovement` immutable ledger tested |
| Pessimistic Stock Reservation (`FOR UPDATE`) | 🟢 Implemented & Verified | `StockReservationService` tested (SEC-05) |
| Supplier Management & Purchase Orders | 🟢 Implemented & Verified | Endpoints exist in `InventoryController.php` |
| Inventory Cost Valuation (FIFO / Weighted Average) | 🟡 Partially Implemented | Unit cost captured in `stock_movements` |

---

## 5. Orders & Fulfillment
| Feature | Status | Notes |
|---|---|---|
| Cart Item Management | 🟢 Implemented & Verified | Session & user carts supported |
| Checkout Submission | 🟢 Implemented & Verified | Server-side totals & stock verified |
| Deterministic Order State Machine | 🟢 Implemented & Verified | `OrderStateMachine` lifecycle tested |
| Courier Provider Abstraction | 🔴 Not Implemented | Target for Phase 3 |
| Steadfast, Pathao & RedX Adapters | 🔴 Not Implemented | Target for Phase 3 |
| Return & Reverse Logistics Management | 🔴 Not Implemented | Target for Phase 3 |

---

## 6. Payment Gateways
| Feature | Status | Notes |
|---|---|---|
| Cash on Delivery (COD) | 🟡 Partially Implemented | Recorded as pending in `PaymentService.php` |
| Customer Wallet Deduction | 🟡 Partially Implemented | Basic debit logic in `PaymentService.php` |
| Payment Gateway Abstraction (`Contract`) | 🔴 Not Implemented | Target for Phase 3 (SEC-02) |
| bKash Adapter | 🔴 Not Implemented | Target for Phase 3 |
| SSLCommerz Adapter | 🔴 Not Implemented | Target for Phase 3 |
| Nagad Adapter | 🔴 Not Implemented | Target for Phase 3 |
| Server-Side Webhook Idempotency & Signature Verification | 🔴 Not Implemented | Target for Phase 3 |

---

## 7. Accounting & Financial Integrity
| Feature | Status | Notes |
|---|---|---|
| Standard Chart of Accounts | 🔴 Not Implemented | Target for Phase 4 |
| Double-Entry Journal Entry Engine | 🔴 Not Implemented | Target for Phase 4 |
| Automated Commerce Journal Postings | 🔴 Not Implemented | Target for Phase 4 |
| Financial Reports (P&L, Balance Sheet, Aging) | 🔴 Not Implemented | Target for Phase 4 |
| Decimal-Safe Monetary Arithmetic | 🔴 Not Implemented | Target for Phase 4 |

---

## 8. Storefront CMS & Page Builder
| Feature | Status | Notes |
|---|---|---|
| Hero Sliders & Static Pages | 🟢 Implemented & Verified | Models and API routes exist in `CmsController.php` |
| FAQs and Blog Posts | 🟢 Implemented & Verified | Models and API routes exist in `CmsController.php` |
| Visual Section-Based Page Builder | 🔴 Not Implemented | Target for Phase 5 |
| Sandboxed Custom HTML/CSS/JS Execution (CSP) | 🔴 Not Implemented | Target for Phase 5 (SEC-04) |
| Multi-Theme Token Architecture | 🔴 Not Implemented | Target for Phase 5 |

---

## 9. AI Assistants
| Feature | Status | Notes |
|---|---|---|
| Local-First Customer Shopping Assistant | 🔴 Not Implemented | Target for Phase 7 |
| Bangla & English Intent Handling | 🔴 Not Implemented | Target for Phase 7 |
| Catalog & Policy Knowledge Base Retrieval | 🔴 Not Implemented | Target for Phase 7 |
| Tenant AI Business Assistant (Reporting Tool) | 🔴 Not Implemented | Target for Phase 7 |
| External LLM Provider Adapters (Encrypted Keys) | 🔴 Not Implemented | Target for Phase 7 |

---

## 10. Marketing, Attribution & Analytics
| Feature | Status | Notes |
|---|---|---|
| Basic Coupon Code Application | 🟢 Implemented & Verified | Handled via `MarketingController.php` |
| Flash Sale Campaigns | 🟢 Implemented & Verified | Handled via `MarketingController.php` |
| Newsletter Subscription | 🟢 Implemented & Verified | Handled via `MarketingController.php` |
| Canonical Commerce Event Dispatcher | 🔴 Not Implemented | Target for Phase 8 |
| Meta Pixel + Conversions API (CAPI) Deduplication | 🔴 Not Implemented | Target for Phase 8 |
| GA4 & Google Ads Enhanced Conversions | 🔴 Not Implemented | Target for Phase 8 |
| Google Consent Mode v2 Platform | 🔴 Not Implemented | Target for Phase 8 |
| First-Party UTM & Click Attribution Engine | 🔴 Not Implemented | Target for Phase 8 |
| Google Merchant Center & Meta Product Feeds | 🔴 Not Implemented | Target for Phase 8 |

---

## 11. SEO, Search & Progressive Web Applications
| Feature | Status | Notes |
|---|---|---|
| Static Storefront Meta Tags | 🟡 Partially Implemented | Present in `index.html` |
| Dynamic SEO Metadata & Sitemaps | 🔴 Not Implemented | Target for Phase 9 |
| Schema.org JSON-LD Structured Data | 🔴 Not Implemented | Target for Phase 9 |
| Storefront PWA (Manifest & Service Worker) | 🔴 Not Implemented | Target for Phase 9 |
| Management Studio PWA | 🔴 Not Implemented | Target for Phase 9 |
| SSR / Pre-rendering for Social Previews | 🔴 Not Implemented | Target for Phase 9 |

