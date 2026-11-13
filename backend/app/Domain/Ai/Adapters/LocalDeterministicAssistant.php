<?php

namespace App\Domain\Ai\Adapters;

use App\Domain\Ai\Contracts\LlmProviderContract;
use App\Domain\Ai\Services\BilingualIntentClassifier;
use App\Domain\Ai\Services\CatalogKnowledgeRetriever;

class LocalDeterministicAssistant implements LlmProviderContract
{
    public function __construct(
        protected BilingualIntentClassifier $classifier,
        protected CatalogKnowledgeRetriever $retriever
    ) {}

    public function getIdentifier(): string
    {
        return 'local';
    }

    public function generateReply(string $prompt, array $context = []): array
    {
        $channel = $context['channel'] ?? 'storefront';
        $userId = $context['user_id'] ?? null;

        // 1. If Staff Backoffice Assistant Channel
        if ($channel === 'backoffice') {
            return $this->handleBusinessAssistantQuery($prompt);
        }

        // 2. Customer Shopping Assistant Channel
        return $this->handleShoppingAssistantQuery($prompt, $userId);
    }

    /**
     * Handle Customer Shopping Assistant inquiries with deterministic intent workflows.
     */
    protected function handleShoppingAssistantQuery(string $prompt, ?int $userId = null): array
    {
        $classification = $this->classifier->classifyCustomerIntent($prompt);
        $intent = $classification['intent'];
        $lang = $classification['language'];

        switch ($intent) {
            case 'greeting':
                $text = ($lang === 'bn' || $lang === 'bn_phonetic')
                    ? "আসসালামু আলাইকুম! সেন্টারপয়েন্ট শপিং এসিস্ট্যান্টে আপনাকে স্বাগতম। আপনি কোন ধরণের পণ্য খুঁজছেন বা আপনার কোন অর্ডারের খোঁজ নিতে চান?"
                    : "Hello and welcome to Centerpoint! I am your personal shopping assistant. Are you looking for a specific collection, or would you like to track an existing order?";
                return [
                    'intent'             => 'greeting',
                    'reply_text'         => $text,
                    'structured_payload' => [
                        'quick_actions' => [
                            ['label' => 'New Arrivals', 'query' => 'Show me new arrivals'],
                            ['label' => 'Track Order', 'query' => 'Where is my order?'],
                            ['label' => 'Return Policy', 'query' => 'What is your return policy?'],
                        ],
                    ],
                ];

            case 'track_order':
                $orderNumber = $classification['order_id'] ?? null;
                $orderStatus = $this->retriever->getOrderTrackingStatus($orderNumber, $userId);

                if (!$orderStatus) {
                    $reply = ($lang === 'bn' || $lang === 'bn_phonetic')
                        ? "আপনার অর্ডারটি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার সঠিক অর্ডার নম্বরটি দিন (যেমন: ORD-12345)।"
                        : "I couldn't locate that order. Please provide your exact order number (for example: ORD-12345) to retrieve live tracking status.";
                    return [
                        'intent'             => 'track_order',
                        'reply_text'         => $reply,
                        'structured_payload' => ['needs_order_number' => true],
                    ];
                }

                $reply = ($lang === 'bn' || $lang === 'bn_phonetic')
                    ? "আপনার অর্ডার #{$orderStatus['order_number']} বর্তমানে [{$orderStatus['status']}] অবস্থায় রয়েছে। কুরিয়ার: {$orderStatus['courier']} (ট্র্যাকিং কোড: {$orderStatus['tracking_code']})।"
                    : "Order #{$orderStatus['order_number']} is currently in [{$orderStatus['status']}] status. Courier: {$orderStatus['courier']} (Tracking Code: {$orderStatus['tracking_code']}).";

                return [
                    'intent'             => 'track_order',
                    'reply_text'         => $reply,
                    'structured_payload' => [
                        'type'    => 'order_card',
                        'details' => $orderStatus,
                    ],
                ];

            case 'check_policy':
                $topic = $classification['topic'] ?? 'returns';
                $policy = $this->retriever->getPolicyKnowledge($topic, $lang);

                return [
                    'intent'             => 'check_policy',
                    'reply_text'         => "{$policy['title']}: {$policy['description']}",
                    'structured_payload' => [
                        'type'    => 'policy_card',
                        'details' => $policy,
                    ],
                ];

            case 'faq_query':
                $topic = $classification['topic'] ?? 'payment';
                $faq = $this->retriever->getPolicyKnowledge($topic, $lang);

                return [
                    'intent'             => 'faq_query',
                    'reply_text'         => "{$faq['title']}: {$faq['description']}",
                    'structured_payload' => [
                        'type'    => 'faq_card',
                        'details' => $faq,
                    ],
                ];

            case 'find_product':
            default:
                $products = $this->retriever->searchProducts($prompt, limit: 4);

                if (empty($products)) {
                    $reply = ($lang === 'bn' || $lang === 'bn_phonetic')
                        ? "দুঃখিত, এই মুহূর্তে এই পণ্যের স্টক শেষ। আপনি কি অন্য কোনো কালেকশন দেখতে চান?"
                        : "We couldn't find items matching that exact query in stock. Here are some of our latest exclusive pieces.";
                } else {
                    $reply = ($lang === 'bn' || $lang === 'bn_phonetic')
                        ? "আপনার জন্য সেরা কিছু কালেকশন খুঁজে পেয়েছি:"
                        : "Here are some exquisite pieces matching your search:";
                }

                return [
                    'intent'             => 'find_product',
                    'reply_text'         => $reply,
                    'structured_payload' => [
                        'type'     => 'product_grid',
                        'products' => $products,
                    ],
                ];
        }
    }

    /**
     * Handle Staff Business Intelligence Assistant inquiries.
     */
    protected function handleBusinessAssistantQuery(string $prompt): array
    {
        $classification = $this->classifier->classifyBusinessIntent($prompt);
        $summary = $this->retriever->getBusinessSummary();

        switch ($classification['intent']) {
            case 'revenue_summary':
                $reply = "Today's total settled revenue is {$summary['today_revenue']} across {$summary['today_orders']} orders.";
                break;

            case 'inventory_low':
                $reply = "There are currently {$summary['low_stock_count']} products with low stock (3 units or fewer) requiring reorder attention.";
                break;

            case 'order_summary':
                $reply = "There are currently {$summary['pending_fulfillment']} orders awaiting warehouse fulfillment or dispatch.";
                break;

            case 'general_analytics':
            default:
                $reply = "Operational Overview for {$summary['date']}: {$summary['today_orders']} orders ({$summary['today_revenue']}), {$summary['pending_fulfillment']} pending fulfillment, {$summary['low_stock_count']} low stock alerts.";
                break;
        }

        return [
            'intent'             => $classification['intent'],
            'reply_text'         => $reply,
            'structured_payload' => [
                'type'    => 'business_kpi',
                'summary' => $summary,
            ],
        ];
    }
}

