<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Payments\PaymentGatewayManager;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $paymentManager
    ) {}

    /**
     * Authoritatively verify an order's payment.
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id'       => 'required|exists:orders,id',
            'gateway'        => 'required|string',
            'transaction_id' => 'required|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        $payment = $this->paymentManager->verifyPayment(
            order: $order,
            method: $validated['gateway'],
            transactionId: $validated['transaction_id'],
            payload: $request->all()
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Payment verification processed',
            'data'    => [
                'order_status'   => $order->fresh()->status,
                'payment_status' => $order->fresh()->payment_status,
                'payment'        => $payment,
            ],
        ]);
    }

    /**
     * Handle incoming gateway webhook/IPN notifications with idempotency.
     */
    public function webhook(Request $request, string $gateway): JsonResponse
    {
        $adapter = $this->paymentManager->resolve($gateway);
        $result = $adapter->handleWebhook($request->all(), $request->headers->all());

        return response()->json([
            'status' => 'success',
            'data'   => $result,
        ]);
    }
}

