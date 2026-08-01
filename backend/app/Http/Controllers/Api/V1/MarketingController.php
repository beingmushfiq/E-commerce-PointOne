<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\FlashSale;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MarketingController extends Controller
{
    // Apply / Validate Coupon
    public function applyCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
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
                'status' => 'error',
                'message' => 'Minimum order amount of ' . $coupon->min_order_amount . ' required'
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
            'data' => [
                'code' => $coupon->code,
                'discount_amount' => round($discount, 2),
                'type' => $coupon->type,
                'value' => $coupon->value,
            ]
        ]);
    }

    // Active Flash Sales
    public function activeFlashSales(): JsonResponse
    {
        $sales = FlashSale::with('products.product.images')
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->get();

        return response()->json(['status' => 'success', 'data' => $sales]);
    }

    // Subscribe to Newsletter
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => 'required|email']);
        $subscriber = Subscriber::firstOrCreate(['email' => $validated['email']], ['is_subscribed' => true]);

        return response()->json(['status' => 'success', 'message' => 'Subscribed successfully', 'data' => $subscriber]);
    }
}
