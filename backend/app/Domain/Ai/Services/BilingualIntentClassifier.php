<?php

namespace App\Domain\Ai\Services;

class BilingualIntentClassifier
{
    /**
     * Classify customer intent from natural language input in Bangla, Banglish, or English.
     */
    public function classifyCustomerIntent(string $input): array
    {
        $normalized = mb_strtolower(trim($input), 'UTF-8');

        // 1. Order Tracking & Delivery Status
        if (
            preg_match('/(ord-[a-z0-9\-_]+)/i', $normalized, $matches) ||
            preg_match('/(track|status|kothay|delivery kobe|order status|parcel|shipment|tracking code|কবে পাব|অর্ডার কোথায়|ট্র্যাকিং)/iu', $normalized)
        ) {
            return [
                'intent'   => 'track_order',
                'language' => $this->detectLanguage($normalized),
                'order_id' => $matches[1] ?? null,
            ];
        }

        // 2. Greetings
        if (preg_match('/^(hi|hello|hey|assalamu alaikum|salam|kemon achen|nomoshkar|নমস্কার|সালাম|হ্যালো|হাই)/iu', $normalized)) {
            return [
                'intent'   => 'greeting',
                'language' => $this->detectLanguage($normalized),
            ];
        }

        // 3. Return, Refund & Exchange Policy
        if (preg_match('/(return|refund|exchange|policy|ferot|damage|reimburse|টাকা ফেরত|ফেরত|রিফান্ড|বদল)/iu', $normalized)) {
            return [
                'intent'   => 'check_policy',
                'topic'    => 'returns',
                'language' => $this->detectLanguage($normalized),
            ];
        }

        // 4. Shipping Fee & Timelines
        if (preg_match('/(shipping fee|delivery charge|outside dhaka|inside dhaka|charge koto|koto taka delivery|ডেলিভারি চার্জ|খরচ)/iu', $normalized)) {
            return [
                'intent'   => 'check_policy',
                'topic'    => 'shipping',
                'language' => $this->detectLanguage($normalized),
            ];
        }

        // 5. Payment Methods
        if (preg_match('/(payment|bkash|nagad|sslcommerz|cod|cash on delivery|bikas|বিকাশ|নগদ|পেমেন্ট|ক্যাশ অন)/iu', $normalized)) {
            return [
                'intent'   => 'faq_query',
                'topic'    => 'payment',
                'language' => $this->detectLanguage($normalized),
            ];
        }

        // 6. Product Search / Catalog Inquiries
        if (preg_match('/(product|collection|sari|panjabi|shirt|shoe|dress|watch|leather|silk|price|koto daam|dam koto|dekhaw|show me|ase|khujchi|কিনতে চাই|দাম|শাড়ি|পাঞ্জাবি)/iu', $normalized)) {
            return [
                'intent'   => 'find_product',
                'language' => $this->detectLanguage($normalized),
            ];
        }

        return [
            'intent'   => 'find_product', // Default fallback to catalog discovery
            'language' => $this->detectLanguage($normalized),
        ];
    }

    /**
     * Classify staff business analytics query.
     */
    public function classifyBusinessIntent(string $input): array
    {
        $normalized = mb_strtolower(trim($input), 'UTF-8');

        if (preg_match('/(sales|revenue|income|mrr|bikri|earnings|বিক্রি|আয়|আজকের সেল)/iu', $normalized)) {
            return ['intent' => 'revenue_summary'];
        }

        if (preg_match('/(low stock|out of stock|reorder|shortage|kom stock|স্টক শেষ|মজুত)/iu', $normalized)) {
            return ['intent' => 'inventory_low'];
        }

        if (preg_match('/(pending orders|processing|fulfillment|koyta order|অর্ডার পেন্ডিং)/iu', $normalized)) {
            return ['intent' => 'order_summary'];
        }

        return ['intent' => 'general_analytics'];
    }

    /**
     * Detect whether the query is in Bangla or English.
     */
    public function detectLanguage(string $text): string
    {
        // Check for Unicode Bengali range (U+0980 to U+09FF)
        if (preg_match('/[\x{0980}-\x{09FF}]/u', $text)) {
            return 'bn';
        }

        // Check for common Banglish phonetic tokens
        if (preg_match('/\b(koto|kivabe|ache|kothay|dekhaw|daam|taka|pabo|ferot|assalamu|salam|kemon|achen|apni|tumi)\b/i', $text)) {
            return 'bn_phonetic';
        }

        return 'en';
    }
}
