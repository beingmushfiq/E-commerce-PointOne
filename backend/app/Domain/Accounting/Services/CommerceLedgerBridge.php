<?php

namespace App\Domain\Accounting\Services;

use App\Models\Accounting\Account;
use App\Models\Accounting\JournalEntry;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class CommerceLedgerBridge
{
    public function __construct(
        protected JournalEntryService $journalService
    ) {}

    /**
     * Record balanced double-entry postings when an order payment is confirmed.
     */
    public function recordOrderPayment(Order $order, Payment $payment): ?JournalEntry
    {
        // 1. Resolve Required Accounts
        $clearingCode = match ($order->payment_method) {
            'cod'    => '1010', // Cash on Hand
            'wallet' => '2020', // Customer Wallet Liability
            default  => '1020', // Gateway & Bank Clearing
        };

        $clearingAccount = Account::where('code', $clearingCode)->first();
        $salesAccount = Account::where('code', '4010')->first();

        if (!$clearingAccount || !$salesAccount) {
            Log::warning("Accounting bridge skipped: essential accounts (1010/1020, 4010) not found.");
            return null;
        }

        $grandTotal = (float) $order->grand_total;
        $subtotal   = (float) $order->subtotal;
        $discount   = (float) ($order->discount_amount ?? $order->discount_total ?? 0.0);
        $tax        = (float) ($order->tax_amount ?? $order->tax_total ?? 0.0);
        $shipping   = (float) ($order->shipping_cost ?? $order->shipping_total ?? 0.0);

        $lines = [];

        // Debit: Cash / Clearing Account (Grand Total received)
        $lines[] = [
            'account_id'  => $clearingAccount->id,
            'debit'       => $grandTotal,
            'credit'      => 0.00,
            'description' => "Payment received for Order #{$order->order_number} ({$order->payment_method})",
        ];

        // Debit: Sales Discount (Contra-revenue) if applied
        if ($discount > 0) {
            $discountAccount = Account::where('code', '4020')->first();
            if ($discountAccount) {
                $lines[] = [
                    'account_id'  => $discountAccount->id,
                    'debit'       => $discount,
                    'credit'      => 0.00,
                    'description' => "Discount applied on Order #{$order->order_number}",
                ];
            }
        }

        // Credit: Sales Revenue (Subtotal)
        $lines[] = [
            'account_id'  => $salesAccount->id,
            'debit'       => 0.00,
            'credit'      => $subtotal,
            'description' => "Merchandise sales for Order #{$order->order_number}",
        ];

        // Credit: VAT Payable (if tax collected)
        if ($tax > 0) {
            $taxAccount = Account::where('code', '2030')->first();
            if ($taxAccount) {
                $lines[] = [
                    'account_id'  => $taxAccount->id,
                    'debit'       => 0.00,
                    'credit'      => $tax,
                    'description' => "VAT collected on Order #{$order->order_number}",
                ];
            }
        }

        // Credit: Shipping Revenue (if shipping charged)
        if ($shipping > 0) {
            $shippingAccount = Account::where('code', '4030')->first();
            if ($shippingAccount) {
                $lines[] = [
                    'account_id'  => $shippingAccount->id,
                    'debit'       => 0.00,
                    'credit'      => $shipping,
                    'description' => "Shipping fee collected on Order #{$order->order_number}",
                ];
            }
        }

        return $this->journalService->createEntry(
            header: [
                'entry_date'  => now()->toDateString(),
                'source_type' => 'payment',
                'source_id'   => $payment->id,
                'description' => "Payment receipt for Order #{$order->order_number}",
            ],
            lines: $lines,
            post: true
        );
    }

    /**
     * Record Cost of Goods Sold (COGS) and inventory asset deduction upon fulfillment.
     */
    public function recordOrderFulfillment(Order $order): ?JournalEntry
    {
        $cogsAccount = Account::where('code', '5010')->first();
        $inventoryAccount = Account::where('code', '1050')->first();

        if (!$cogsAccount || !$inventoryAccount) {
            Log::warning("Accounting bridge skipped: COGS (5010) or Inventory (1050) account not found.");
            return null;
        }

        // Calculate total cost of merchandise sold
        $order->loadMissing('items.product');
        $totalCost = 0.0;

        foreach ($order->items as $item) {
            // Check snapshot cost first, then product cost price, fallback to estimated 60% cost
            $costPrice = (float) (
                $item->snapshot_data['cost_price']
                ?? $item->product?->cost_price
                ?? ($item->unit_price * 0.60)
            );
            $totalCost += ($costPrice * $item->quantity);
        }

        if ($totalCost <= 0.0) {
            return null;
        }

        $lines = [
            [
                'account_id'  => $cogsAccount->id,
                'debit'       => round($totalCost, 2),
                'credit'      => 0.00,
                'description' => "Cost of Goods Sold for Order #{$order->order_number}",
            ],
            [
                'account_id'  => $inventoryAccount->id,
                'debit'       => 0.00,
                'credit'      => round($totalCost, 2),
                'description' => "Inventory reduction for Order #{$order->order_number}",
            ],
        ];

        return $this->journalService->createEntry(
            header: [
                'entry_date'  => now()->toDateString(),
                'source_type' => 'cogs',
                'source_id'   => $order->id,
                'description' => "COGS & inventory reduction for Order #{$order->order_number}",
            ],
            lines: $lines,
            post: true
        );
    }

    /**
     * Record customer refund postings.
     */
    public function recordOrderRefund(Order $order, float $refundAmount, string $reason = 'Customer refund'): ?JournalEntry
    {
        $refundAccount = Account::where('code', '4020')->first(); // Sales Returns/Allowances
        $clearingAccount = Account::where('code', '1020')->first() ?: Account::where('code', '1010')->first();

        if (!$refundAccount || !$clearingAccount || $refundAmount <= 0) {
            return null;
        }

        $lines = [
            [
                'account_id'  => $refundAccount->id,
                'debit'       => round($refundAmount, 2),
                'credit'      => 0.00,
                'description' => "Refund issued for Order #{$order->order_number}: {$reason}",
            ],
            [
                'account_id'  => $clearingAccount->id,
                'debit'       => 0.00,
                'credit'      => round($refundAmount, 2),
                'description' => "Disbursement for Order #{$order->order_number} refund",
            ],
        ];

        return $this->journalService->createEntry(
            header: [
                'entry_date'  => now()->toDateString(),
                'source_type' => 'refund',
                'source_id'   => $order->id,
                'description' => "Refund for Order #{$order->order_number}: {$reason}",
            ],
            lines: $lines,
            post: true
        );
    }
}
