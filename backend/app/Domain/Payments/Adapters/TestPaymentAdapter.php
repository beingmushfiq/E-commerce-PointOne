<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Str;

class TestPaymentAdapter implements PaymentGatewayContract
{
    public function __construct(
        protected bool $shouldSucceed = true
    ) {}

    public function getIdentifier(): string
    {
        return 'test';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $transactionId = 'TEST-' . strtoupper(Str::random(12));

        return [
            'status'         => $this->shouldSucceed ? 'completed' : 'failed',
            'transaction_id' => $transactionId,
            'payload'        => [
                'test_mode' => true,
                'amount'    => (float) $order->grand_total,
            ],
        ];
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        return [
            'verified'       => $this->shouldSucceed,
            'transaction_id' => $transactionId,
            'amount'         => (float) ($payload['amount'] ?? 100.00),
            'status'         => $this->shouldSucceed ? 'paid' : 'failed',
            'raw_response'   => ['test' => true],
        ];
    }

    public function processRefund(Order $order, float $amount, string $reason = ''): array
    {
        return [
            'success'   => true,
            'refund_id' => 'REF-TEST-' . strtoupper(Str::random(8)),
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'transaction_id' => $payload['transaction_id'] ?? 'TEST-WEBHOOK',
            'status'         => 'paid',
        ];
    }
}

