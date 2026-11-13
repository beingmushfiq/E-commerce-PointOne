<?php

namespace App\Domain\Ai\Services;

use App\Models\Faq;
use App\Models\Order;
use App\Models\Page;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class CatalogKnowledgeRetriever
{
    /**
     * Search product catalog for matching customer keywords.
     */
    public function searchProducts(string $query, int $limit = 4): array
    {
        // Strip common conversational stopwords
        $cleaned = preg_replace(
            '/\b(show|me|i|want|to|buy|price|cost|of|koto|daam|dekhaw|dekhte|chai|ache|product|item)\b/i',
            '',
            $query
        );
        $keywords = array_filter(explode(' ', trim($cleaned)));

        $productQuery = Product::query()->where('quantity', '>', 0);

        if (!empty($keywords)) {
            $productQuery->where(function ($q) use ($keywords) {
                foreach ($keywords as $word) {
                    $w = trim($word);
                    if (strlen($w) >= 2) {
                        $q->orWhere('name', 'like', "%{$w}%")
                          ->orWhere('summary', 'like', "%{$w}%")
                          ->orWhere('sku', 'like', "%{$w}%");
                    }
                }
            });
        }

        $products = $productQuery->latest('id')->limit($limit)->get();

        // If no keyword matches, fetch featured/top luxury products
        if ($products->isEmpty()) {
            $products = Product::where('quantity', '>', 0)->latest('id')->limit($limit)->get();
        }

        return $products->map(function ($p) {
            return [
                'id'              => $p->id,
                'name'            => $p->name,
                'slug'            => $p->slug,
                'sku'             => $p->sku,
                'price'           => (float) $p->price,
                'formatted_price' => '৳' . number_format((float) $p->price, 2),
                'quantity'        => $p->quantity,
                'is_in_stock'     => $p->quantity > 0,
            ];
        })->toArray();
    }

    /**
     * Retrieve authoritative store policy knowledge for returns, shipping, and payments.
     */
    public function getPolicyKnowledge(string $topic, string $lang = 'en'): array
    {
        return match ($topic) {
            'returns' => [
                'title'       => 'Return & Exchange Policy',
                'description' => ($lang === 'bn' || $lang === 'bn_phonetic')
                    ? 'আমাদের ডেলিভারির পর ৭ দিনের মধ্যে আন-ইউজড অবস্থায় এক্সচেঞ্জ ও রিটার্ন পলিসি রয়েছে। রিফান্ড ২-৩ কার্যদিবসের মধ্যে আপনার মূল অ্যাকাউন্টে ফেরত যাবে।'
                    : 'We offer a hassle-free 7-day exchange and return policy on unworn, unaltered items with original tags. Refunds are processed within 2-3 business days.',
                'timeline'    => '7 Days',
                'charge'      => 'Free for defective or incorrect items',
            ],
            'shipping' => [
                'title'       => 'Shipping & Delivery Timelines',
                'description' => ($lang === 'bn' || $lang === 'bn_phonetic')
                    ? 'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (২৪-৪৮ ঘণ্টা)। ঢাকার বাইরে ডেলিভারি চার্জ ১২০ টাকা (২-৪ কার্যদিবস)।'
                    : 'Inside Dhaka delivery is ৳60 (24-48 hours). Outside Dhaka delivery is ৳120 across all 64 districts via Steadfast, Pathao, and RedX (2-4 business days).',
                'inside_dhaka'  => '৳60 (24-48 Hours)',
                'outside_dhaka' => '৳120 (2-4 Business Days)',
            ],
            default => [
                'title'       => 'Payment Methods',
                'description' => ($lang === 'bn' || $lang === 'bn_phonetic')
                    ? 'আমরা ক্যাশ অন ডেলিভারি (COD), বিকাশ (bKash), নগদ (Nagad), এবং ভিসা/মাস্টারকার্ড অনলাইন পেমেন্ট সাপোর্ট করি।'
                    : 'We support Cash on Delivery (COD), bKash Instant Checkout, Nagad, and Credit/Debit Cards via SSLCommerz with encrypted server verification.',
            ],
        };
    }

    /**
     * Authoritatively resolve real order and delivery tracking status.
     */
    public function getOrderTrackingStatus(?string $orderNumber, ?int $userId = null): ?array
    {
        if (empty($orderNumber)) {
            // Find user's latest order if authenticated
            if ($userId) {
                $order = Order::where('user_id', $userId)->latest('id')->with('shipments')->first();
            } else {
                return null;
            }
        } else {
            $order = Order::where('order_number', strtoupper(trim($orderNumber)))
                ->with('shipments')
                ->first();
        }

        if (!$order) {
            return null;
        }

        $latestShipment = $order->shipments->last();

        return [
            'order_number'    => $order->order_number,
            'status'          => $order->status,
            'payment_status'  => $order->payment_status,
            'payment_method'  => $order->payment_method,
            'grand_total'     => '৳' . number_format((float) $order->grand_total, 2),
            'courier'         => $latestShipment?->courier_name ?? 'Pending Assignment',
            'tracking_code'   => $latestShipment?->tracking_code ?? 'Not yet generated',
            'delivery_status' => $latestShipment?->status ?? 'Processing in warehouse',
            'created_at'      => $order->created_at->format('M d, Y h:i A'),
        ];
    }

    /**
     * Compile real, authoritative operational business statistics for staff assistants.
     */
    public function getBusinessSummary(): array
    {
        $today = now()->toDateString();

        $todayOrders = Order::whereDate('created_at', $today)->count();
        $todayRevenue = (float) Order::whereDate('created_at', $today)
            ->where('payment_status', 'paid')
            ->sum('grand_total');

        $pendingFulfillment = Order::whereIn('status', ['confirmed', 'processing', 'ready_for_shipment'])->count();

        $lowStockCount = Product::where('quantity', '<=', 3)->count();
        $lowStockItems = Product::where('quantity', '<=', 3)
            ->select('name', 'sku', 'quantity')
            ->limit(5)
            ->get()
            ->toArray();

        return [
            'date'                => $today,
            'today_orders'        => $todayOrders,
            'today_revenue'       => '৳' . number_format($todayRevenue, 2),
            'pending_fulfillment' => $pendingFulfillment,
            'low_stock_count'     => $lowStockCount,
            'low_stock_items'     => $lowStockItems,
        ];
    }
}

