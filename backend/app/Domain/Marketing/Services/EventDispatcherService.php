<?php

namespace App\Domain\Marketing\Services;

use App\Domain\Marketing\Adapters\MetaCapiAdapter;
use App\Models\Marketing\MarketingConfig;
use App\Models\Marketing\MarketingEvent;
use Illuminate\Support\Str;

class EventDispatcherService
{
    public function __construct(
        protected MetaCapiAdapter $metaCapiAdapter
    ) {}

    /**
     * Dispatch a canonical commerce event with deterministic client-server deduplication.
     */
    public function dispatch(
        string $eventName,
        array $customData = [],
        array $userData = [],
        ?int $userId = null,
        ?int $orderId = null,
        ?string $sessionId = null,
        ?string $clientEventId = null,
        string $eventSource = 'server'
    ): MarketingEvent {
        $eventId = $clientEventId ?: (string) Str::uuid();

        // 1. FirstOrCreate ensures replay protection for identical event_ids
        $event = MarketingEvent::firstOrCreate(
            ['event_id' => $eventId],
            [
                'event_name'   => $eventName,
                'user_id'      => $userId,
                'order_id'     => $orderId,
                'session_id'   => $sessionId,
                'event_source' => $eventSource,
                'user_data'    => $userData,
                'custom_data'  => $customData,
                'status'       => 'pending',
            ]
        );

        // 2. Dispatch to Meta CAPI
        $config = MarketingConfig::first();
        if ($config) {
            $this->metaCapiAdapter->sendEvent($event, $config);
        }

        return $event->fresh();
    }
}

