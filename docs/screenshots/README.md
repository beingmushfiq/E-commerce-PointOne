# CENTERPOINT — Visual Product Showcase & Screenshot Specification

This directory holds authentic visual assets and product captures for CENTERPOINT.

> [!NOTE]
> Per the CENTERPOINT Non-Negotiable Operational Principles, mock or synthetic screenshots are prohibited. All images in this directory must be captured directly from running instances of the application (either Standalone Edition or SaaS Edition).

---

## 1. Screenshot Capture Specification

| Parameter | Desktop Standard | Mobile Standard |
|---|---|---|
| **Viewport Size** | 1920 × 1080 (or 1440 × 900) | 390 × 844 (iPhone 14/15/16 Pro) |
| **Color Profile** | sRGB | sRGB |
| **Format** | PNG (lossless) or WebP (quality 90+) | PNG or WebP |
| **Max File Size** | < 800 KB per image (run `pngquant` or `oxipng`) | < 350 KB per image |
| **Theme** | Light & Dark variants where applicable | Light & Dark variants |

---

## 2. Screenshot Checklist & Asset Registry

| Index | File Name | Screen / Interface | Description | Status |
|:---:|---|---|---|:---:|
| **01** | `01-storefront-home.png` | Storefront Homepage | Editorial Hero, featured luxury watch collection, and navigation bar | Ready for capture |
| **02** | `02-storefront-product.png` | Product Detail Page | High-res imagery, specs, BDT pricing, stock status, and add-to-cart drawer | Ready for capture |
| **03** | `03-cart-checkout.png` | Cart & Checkout Modal | Shipping address collection, coupon code, bKash/SSLCommerz selector | Ready for capture |
| **04** | `04-admin-dashboard.png` | Management Studio | Live KPI cards (revenue, orders, AOV), recent orders, and health probe indicator | Ready for capture |
| **05** | `05-product-catalog.png` | Product Matrix | Inventory level monitor, SKU search, pricing controls, and variant matrix | Ready for capture |
| **06** | `06-order-lifecycle.png` | Order State Machine | 16-state deterministic lifecycle inspector, frozen line-item pricing, invoice view | Ready for capture |
| **07** | `07-inventory-ledger.png` | Stock Movement Ledger | Immutable movement history (PURCHASE_RECEIPT, SALE_FULFILLMENT), warehouse filter | Ready for capture |
| **08** | `08-double-entry-accounting.png` | Financial Statements | Balanced Trial Balance ($\sum \text{debits} == \sum \text{credits}$), P&L, Balance Sheet | Ready for capture |
| **09** | `09-visual-cms-builder.png` | CMS & Visual Builder | Section editor, SandboxedEmbed iframe preview, theme token palette | Ready for capture |
| **10** | `10-saas-master-control.png` | Platform Master Control | Multi-tenant MRR/ARR dashboard, tenant provisioning, system health probes | Ready for capture |
| **11** | `11-local-ai-assistant.png` | AI Shopping Assistant | Bangla & English catalog NLP query answering without external LLM dependency | Ready for capture |
| **12** | `12-mobile-pwa.png` | Mobile PWA View | Responsive touch layout, install prompt, and offline service worker status | Ready for capture |

---

## 3. How to Capture & Update Showcase Assets

1. **Start the local platform:**
   ```bash
   # Backend
   cd backend && php artisan serve
   # Frontend
   cd frontend && npm run dev
   ```
2. **Seed demo data:**
   ```bash
   cd backend && php artisan migrate:fresh --seed
   ```
3. Capture screens using DevTools Device Toolbar or browser screenshot tools at the specified resolutions.
4. Place files in this directory (`docs/screenshots/`) following the exact file naming convention above.

