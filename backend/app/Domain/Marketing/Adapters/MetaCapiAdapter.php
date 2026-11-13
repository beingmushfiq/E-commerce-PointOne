<?php

namespace App\Domain\Marketing\Adapters;

use App\Models\Marketing\MarketingConfig;
use App\Models\Marketing\MarketingEvent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaCapiAdapter
{
    /**
     * Format a canonical marketing event into Meta Conversions API (CAPI) schema with SHA-256 normalization.
     */
    public function formatEvent(MarketingEvent $event, MarketingConfig $config): array
    {
        $rawUserData = $event->user_data ?? [];

        // Meta requires SHA-256 lowercase hashing for PII fields
        $formattedUserData = [];

        if (!empty($rawUserData['email'])) {
            $formattedUserData['em'] = hash('sha256', strtolower(trim($rawUserData['email'])));
        }

        if (!empty($rawUserData['phone'])) {
            $formattedUserData['ph'] = hash('sha256', preg_replace('/[^0-9]/', '', $rawUserData['phone']));
        }

        if (!empty($rawUserData['client_ip'])) {
            $formattedUserData['client_ip_address'] = $rawUserData['client_ip'];
        }

        if (!empty($rawUserData['user_agent'])) {
            $formattedUserData['client_user_agent'] = $rawUserData['user_agent'];
        }

        if (!empty($rawUserData['fbp'])) {
            $formattedUserData['fbp'] = $rawUserData['fbp'];
        }

        if (!empty($rawUserData['fbc'])) {
            $formattedUserData['fbc'] = $rawUserData['fbc'];
        }

        $eventPayload = [
            'event_name'       => $event->event_name,
            'event_time'       => $event->created_at ? $event->created_at->timestamp : time(),
            'event_id'         => $event->event_id, // Shared with browser Meta Pixel for 100% deduplication
            'event_source_url' => $rawUserData['page_url'] ?? config('app.url'),
            'action_source'    => 'website',
            'user_data'        => $formattedUserData,
            'custom_data'      => $event->custom_data ?? [],
        ];

        return $eventPayload;
    }

    /**
     * Dispatch event to Meta Conversions API endpoint.
     */
    public function sendEvent(MarketingEvent $event, MarketingConfig $config): array
    {
        if (!$config->enable_meta_capi || empty($config->meta_pixel_id) || empty($config->encrypted_meta_capi_token)) {
            $event->update([
                'status'        => 'dispatched',
                'error_message' => 'CAPI mock/test mode: valid token not provided or CAPI disabled',
                'dispatched_at' => now(),
            ]);
            return ['success' => true, 'mock' => true];
        }

        $formattedEvent = $this->formatEvent($event, $config);

        $body = [
            'data' => [$formattedEvent],
        ];

        if (!empty($config->meta_test_event_code)) {
            $body['test_event_code'] = $config->meta_test_event_code;
        }

        try {
            $url = "https://graph.facebook.com/v19.0/{$config->meta_pixel_id}/events";
            $response = Http::withToken($config->encrypted_meta_capi_token)
                ->timeout(5)
                ->post($url, $body);

            if ($response->successful()) {
                $event->update([
                    'status'        => 'dispatched',
                    'dispatched_at' => now(),
                ]);
                return ['success' => true, 'response' => $response->json()];
            } else {
                $event->update([
                    'status'        => 'failed',
                    'error_message' => $response->body(),
                ]);
                return ['success' => false, 'error' => $response->body()];
            }
        } catch (\Throwable $e) {
            Log::error("Meta CAPI dispatch error: " . $e->getMessage());
            $event->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}

