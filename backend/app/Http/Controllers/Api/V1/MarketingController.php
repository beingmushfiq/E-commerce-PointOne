<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketing\Services\EventDispatcherService;
use App\Domain\Marketing\Services\ProductFeedService;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\FlashSale;
use App\Models\Marketing\MarketingConfig;
use App\Models\Marketing\MarketingEvent;
use App\Models\Marketing\OrderAttribution;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MarketingController extends Controller
{
    // ==========================================
    // PROMOTIONS & SUBSCRIBERS
    // ==========================================

    public function applyCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'     => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return response()->json(['status' => 'error', 'message' => 'Invalid coupon code'], 404);
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return response()->json(['status' => 'error', 'message' => 'Coupon has expired'], 422);
        }

        if ($validated['subtotal'] < $coupon->min_order_amount) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Minimum order amount of ' . $coupon->min_order_amount . ' required',
            ], 422);
        }

        $discount = 0.00;
        if ($coupon->type === 'fixed') {
            $discount = min($coupon->value, $validated['subtotal']);
        } else {
            $discount = ($validated['subtotal'] * $coupon->value) / 100;
            if ($coupon->max_discount) {
                $discount = min($discount, $coupon->max_discount);
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'code'            => $coupon->code,
                'discount_amount' => round($discount, 2),
                'type'            => $coupon->type,
                'value'           => $coupon->value,
            ],
        ]);
    }

    public function activeFlashSales(): JsonResponse
    {
        $sales = FlashSale::with('products.product.images')
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->get();

        return response()->json(['status' => 'success', 'data' => $sales]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => 'required|email']);
        $subscriber = Subscriber::firstOrCreate(['email' => $validated['email']], ['is_subscribed' => true]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Subscribed successfully',
            'data'    => $subscriber,
        ]);
    }

    // ==========================================
    // CANONICAL EVENTS & SERVER CAPI
    // ==========================================

    /**
     * Ingest browser or server commerce event with client deduplication ID.
     */
    public function trackEvent(Request $request, EventDispatcherService $dispatcher): JsonResponse
    {
        $validated = $request->validate([
            'event_name'       => 'required|string|max:50',
            'event_id'         => 'nullable|string|max:64',
            'session_id'       => 'nullable|string|max:100',
            'order_id'         => 'nullable|integer',
            'user_data'        => 'nullable|array',
            'custom_data'      => 'nullable|array',
        ]);

        $userData = $validated['user_data'] ?? [];
        // Automatically inject client IP and user agent if not provided
        $userData['client_ip'] = $userData['client_ip'] ?? $request->ip();
        $userData['user_agent'] = $userData['user_agent'] ?? $request->userAgent();

        $event = $dispatcher->dispatch(
            eventName: $validated['event_name'],
            customData: $validated['custom_data'] ?? [],
            userData: $userData,
            userId: $request->user()?->id,
            orderId: $validated['order_id'] ?? null,
            sessionId: $validated['session_id'] ?? null,
            clientEventId: $validated['event_id'] ?? null,
            eventSource: 'browser'
        );

        return response()->json([
            'status' => 'success',
            'data'   => [
                'event_id'   => $event->event_id,
                'event_name' => $event->event_name,
                'status'     => $event->status,
            ],
        ]);
    }

    /**
     * Generate Google Merchant Center compliant XML product feed.
     */
    public function googleMerchantFeed(ProductFeedService $feedService): Response
    {
        $xmlContent = $feedService->generateGoogleMerchantXml();

        return response($xmlContent, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * Get public tracking configurations and Google Consent Mode v2 defaults.
     */
    public function config(): JsonResponse
    {
        $config = MarketingConfig::firstOrCreate(
            ['id' => 1],
            [
                'default_consent_ad_storage' => true,
                'default_consent_analytics'  => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'data'   => [
                'meta_pixel_id'              => $config->meta_pixel_id,
                'enable_meta_capi'           => $config->enable_meta_capi,
                'ga4_measurement_id'         => $config->ga4_measurement_id,
                'enable_ga4'                 => $config->enable_ga4,
                'default_consent_ad_storage' => $config->default_consent_ad_storage,
                'default_consent_analytics'  => $config->default_consent_analytics,
            ],
        ]);
    }

    // ==========================================
    // PRIVILEGED MARKETING & ATTRIBUTION ENDPOINTS
    // ==========================================

    public function updateConfig(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'meta_pixel_id'              => 'nullable|string|max:50',
            'meta_capi_token'            => 'nullable|string',
            'meta_test_event_code'       => 'nullable|string|max:50',
            'ga4_measurement_id'         => 'nullable|string|max:50',
            'ga4_api_secret'             => 'nullable|string',
            'enable_meta_capi'           => 'boolean',
            'enable_ga4'                 => 'boolean',
            'default_consent_ad_storage' => 'boolean',
            'default_consent_analytics'  => 'boolean',
        ]);

        $config = MarketingConfig::firstOrCreate(
            ['id' => 1],
            [
                'enable_meta_capi'           => false,
                'enable_ga4'                 => false,
                'default_consent_ad_storage' => true,
                'default_consent_analytics'  => true,
            ]
        );

        $data = [
            'meta_pixel_id'              => $validated['meta_pixel_id'] ?? $config->meta_pixel_id,
            'meta_test_event_code'       => $validated['meta_test_event_code'] ?? $config->meta_test_event_code,
            'ga4_measurement_id'         => $validated['ga4_measurement_id'] ?? $config->ga4_measurement_id,
            'enable_meta_capi'           => $validated['enable_meta_capi'] ?? ($config->enable_meta_capi ?? false),
            'enable_ga4'                 => $validated['enable_ga4'] ?? ($config->enable_ga4 ?? false),
            'default_consent_ad_storage' => $validated['default_consent_ad_storage'] ?? ($config->default_consent_ad_storage ?? true),
            'default_consent_analytics'  => $validated['default_consent_analytics'] ?? ($config->default_consent_analytics ?? true),
        ];

        if (!empty($validated['meta_capi_token'])) {
            $data['encrypted_meta_capi_token'] = $validated['meta_capi_token'];
        }

        if (!empty($validated['ga4_api_secret'])) {
            $data['encrypted_ga4_api_secret'] = $validated['ga4_api_secret'];
        }

        $config->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Marketing configuration updated successfully',
            'data'    => $config->fresh(),
        ]);
    }

    public function eventsLog(Request $request): JsonResponse
    {
        $query = MarketingEvent::with('order:id,order_number,grand_total')
            ->latest('id');

        if ($request->has('event_name')) {
            $query->where('event_name', $request->query('event_name'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        $events = $query->paginate($request->query('per_page', 25));

        return response()->json([
            'status' => 'success',
            'data'   => $events,
        ]);
    }

    public function attributionStats(): JsonResponse
    {
        $stats = OrderAttribution::join('orders', 'order_attributions.order_id', '=', 'orders.id')
            ->selectRaw('order_attributions.utm_source, order_attributions.utm_campaign, count(orders.id) as orders_count, sum(orders.grand_total) as total_revenue')
            ->groupBy('order_attributions.utm_source', 'order_attributions.utm_campaign')
            ->orderByDesc('total_revenue')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}
