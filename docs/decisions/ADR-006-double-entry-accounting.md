# ADR-006: Double-Entry Accounting Engine & Immutable Financial Ledger

## Status
Accepted

## Context
Standard e-commerce starter kits typically track financials via simple aggregate sums: adding an `order.grand_total` to revenue, or subtracting an `expense.amount`. This approach is fragile:
- It fails to reconcile with payment gateway deductions, partial refunds, chargebacks, Cash on Delivery (COD) courier settlements, VAT liabilities, and inventory holding costs.
- It provides no audit trail if an order total is recalculated or altered post-sale.
- It cannot generate standard financial statements (Balance Sheet, Profit & Loss, Trial Balance).

## Decision
We implement a **pure double-entry general ledger** within the tenant database:
1. **Standard Chart of Accounts:**
   Accounts are partitioned into five canonical categories:
   - Assets (1000s): Cash, Bank accounts, Gateway settlements (bKash/SSLCommerz), Accounts Receivable, COD Receivables, Merchandise Inventory.
   - Liabilities (2000s): Accounts Payable, VAT/Tax Payable, Customer Credits.
   - Equity (3000s): Owner's Equity, Retained Earnings.
   - Revenue (4000s): Sales Revenue, Shipping Revenue, Other Income.
   - Expenses / COGS (5000s / 6000s): Cost of Goods Sold, Courier Fees, Payment Processing Fees, Operating Expenses.
2. **Zero-Balance Invariant:**
   Every posted `journal_entries` record must satisfy:
   $$\sum \text{Debit Lines} == \sum \text{Credit Lines}$$
3. **Immutability & Reversals:**
   Posted journal entries can **never** be edited or deleted. Financial corrections must be executed by posting an official reversal journal entry linked via `reversal_of_id`, followed by the revised entry.
4. **Automated Event Listeners:**
   Commerce events automatically generate draft or posted journal entries:
   - Order Paid: `Dr. Cash/Receivable`, `Cr. Sales Revenue` (+ `Cr. VAT Payable`)
   - Order Delivered (COGS): `Dr. Cost of Goods Sold`, `Cr. Merchandise Inventory`
   - Customer Refund: `Dr. Sales Returns`, `Cr. Cash/Bank`

## Consequences
- **Positive:**
  - Audit-grade financial accuracy and investor-ready reporting.
  - Effortless reconciliation of courier COD disbursements against actual sales.
- **Negative:**
  - Developers must understand basic accounting mechanics when introducing new financial transaction types.

