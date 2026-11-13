<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Str;

class CodPaymentAdapter implements PaymentGatewayContract
{
    public function getIdentifier(): string
    {
        return 'cod';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $transactionId = 'COD-' . strtoupper(Str::random(12));

        return [
            'status'         => 'pending',
            'transaction_id' => $transactionId,
            'payload'        => [
                'type'       => 'cash_on_delivery',
                'amount'     => (float) $order->grand_total,
                'created_at' => now()->toIso8601String(),
            ],
        ];
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        // COD payment is marked verified only upon confirmation of courier parcel delivery
        $isDelivered = ($payload['status'] ?? '') === 'delivered';

        return [
            'verified'       => $isDelivered,
            'transaction_id' => $transactionId,
            'amount'         => (float) ($payload['amount'] ?? 0.00),
            'status'         => $isDelivered ? 'paid' : 'pending',
            'raw_response'   => $payload,
        ];
    }

    public function processRefund(Order $order, float $amount, string $reason = ''): array
    {
        return [
            'success'   => true,
            'refund_id' => 'REF-COD-' . strtoupper(Str::random(10)),
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled' => true,
            'status'  => 'acknowledged',
        ];
    }
}

