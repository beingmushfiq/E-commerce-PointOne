<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Services\OrderStateMachine;
use App\Services\PaymentService;
use App\Services\StockReservationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    // Cart operations
    public function getCart(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request);
        $cart->load(['items.product.images', 'items.variant']);

        return response()->json(['status' => 'success', 'data' => $cart]);
    }

    public function addToCart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $this->getOrCreateCart($request);
        $product = Product::findOrFail($validated['product_id']);
        $variant = isset($validated['product_variant_id']) ? ProductVariant::find($validated['product_variant_id']) : null;

        $unitPrice = $variant ? ($variant->sale_price ?? $variant->price) : ($product->sale_price ?? $product->price);

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->where('product_variant_id', $variant?->id)
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $validated['quantity'];
            $cartItem->total_price = $cartItem->quantity * $unitPrice;
            $cartItem->save();
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $validated['quantity'] * $unitPrice,
            ]);
        }

        $this->recalculateCartTotal($cart);

        return response()->json(['status' => 'success', 'data' => $cart->fresh(['items.product.images', 'items.variant'])]);
    }

    public function processCheckout(
        Request $request,
        PaymentService $paymentService,
        StockReservationService $stockReservationService,
        OrderStateMachine $orderStateMachine
    ): JsonResponse {
        $validated = $request->validate([
            'shipping_address' => 'required|array',
            'shipping_address.full_name' => 'required|string',
            'shipping_address.address_line_1' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.country' => 'required|string',
            'billing_address' => 'nullable|array',
            'payment_method' => 'required|string|in:stripe,paypal,sslcommerz,bkash,nagad,rocket,cod,wallet',
            'notes' => 'nullable|string',
        ]);

        $cart = $this->getOrCreateCart($request);
        if ($cart->items->isEmpty()) {
            return response()->json(['status' => 'error', 'message' => 'Cart is empty'], 422);
        }

        try {
            return DB::transaction(function () use ($request, $validated, $cart, $paymentService, $stockReservationService, $orderStateMachine) {
                $orderNumber = 'ORD-' . strtoupper(Str::random(10));

                // Recalculate authoritative server-side totals
                $subtotal = 0.00;
                foreach ($cart->items as $item) {
                    $itemPrice = $item->variant ? ($item->variant->sale_price ?? $item->variant->price) : ($item->product->sale_price ?? $item->product->price);
                    $subtotal += ($itemPrice * $item->quantity);
                }

                $shippingCost = 50.00; // Flat rate shipping
                $tax = 0.00;
                $grandTotal = $subtotal + $shippingCost + $tax;

                $order = Order::create([
                    'user_id' => $request->user()?->id,
                    'order_number' => $orderNumber,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'payment_method' => $validated['payment_method'],
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'tax_amount' => $tax,
                    'grand_total' => $grandTotal,
                    'shipping_address' => $validated['shipping_address'],
                    'billing_address' => $validated['billing_address'] ?? $validated['shipping_address'],
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Record initial state transition in ledger
                \App\Models\OrderStateTransition::create([
                    'order_id'    => $order->id,
                    'from_status' => 'none',
                    'to_status'   => 'pending',
                    'actor_type'  => $request->user() ? 'customer' : 'guest',
                    'actor_id'    => $request->user()?->id,
                    'reason'      => 'Order created during checkout',
                ]);

                $primaryWarehouse = Warehouse::where('is_active', true)->first();

                foreach ($cart->items as $item) {
                    // 1. Create order item with immutable snapshot
                    $order->items()->create([
                        'product_id'         => $item->product_id,
                        'product_variant_id' => $item->product_variant_id,
                        'product_name'       => $item->product->name,
                        'variant_name'       => $item->variant?->name,
                        'sku'                => $item->variant?->sku ?? $item->product->sku,
                        'unit_price'         => $item->unit_price,
                        'quantity'           => $item->quantity,
                        'total_price'        => $item->total_price,
                        'snapshot_data'      => [
                            'product_id'  => $item->product_id,
                            'name'        => $item->product->name,
                            'sku'         => $item->variant?->sku ?? $item->product->sku,
                            'unit_price'  => (float) $item->unit_price,
                            'image_url'   => $item->product->images->where('is_primary', true)->first()?->image_path,
                            'summary'     => $item->product->summary,
                            'type'        => $item->product->type,
                        ],
                    ]);

                    // 2. Perform concurrent-safe stock deduction via ledger if warehouse active
                    if ($primaryWarehouse) {
                        $stockReservationService->commitReservation(
                            warehouseId: $primaryWarehouse->id,
                            productId: $item->product_id,
                            quantity: $item->quantity,
                            variantId: $item->product_variant_id,
                            referenceType: 'order',
                            referenceId: $orderNumber
                        );
                    } else {
                        // Fallback deduction if warehouse registry not yet initialized
                        if ($item->variant) {
                            $item->variant->decrement('quantity', $item->quantity);
                        } else {
                            $item->product->decrement('quantity', $item->quantity);
                        }
                    }
                }

                // 3. Process Payment Gateway
                $payment = $paymentService->processPayment($order, $validated['payment_method']);

                if ($order->payment_status === 'paid' && $orderStateMachine->canTransition($order, 'processing')) {
                    $orderStateMachine->transition($order, 'processing', 'system', reason: 'Payment received');
                }

                // 4. Clear Cart
                $cart->items()->delete();
                $cart->update(['total_amount' => 0.00]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Order placed successfully',
                    'data' => [
                        'order' => $order->load(['items', 'payments', 'transitions']),
                        'payment' => $payment,
                    ]
                ], 201);
            });
        } catch (InsufficientStockException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
                'product_id' => $e->productId,
            ], 422);
        }
    }

    private function getOrCreateCart(Request $request): Cart
    {
        $user = $request->user('sanctum');
        $sessionId = $request->header('X-Session-ID', 'guest-' . Str::random(16));

        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        return Cart::firstOrCreate(['session_id' => $sessionId]);
    }

    private function recalculateCartTotal(Cart $cart): void
    {
        $total = $cart->items()->sum('total_price');
        $cart->update(['total_amount' => $total]);
    }
}
