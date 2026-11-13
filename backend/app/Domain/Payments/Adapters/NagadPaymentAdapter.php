<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Str;

class NagadPaymentAdapter implements PaymentGatewayContract
{
    protected string $merchantId;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->merchantId = $config['merchant_id'] ?? (string) env('NAGAD_MERCHANT_ID', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('NAGAD_BASE_URL', 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0');
    }

    public function getIdentifier(): string
    {
        return 'nagad';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $paymentRefId = 'NAGAD-' . strtoupper(Str::random(12));

        return [
            'status'         => 'redirect',
            'transaction_id' => $paymentRefId,
            'redirect_url'   => $this->baseUrl . '/api/dfs/check-out/initialize/' . $this->merchantId . '/' . $paymentRefId,
            'payload'        => [
                'merchantId'   => $this->merchantId,
                'orderId'      => $order->order_number,
                'amount'       => (string) number_format((float) $order->grand_total, 2, '.', ''),
                'challenge'    => Str::random(40),
            ],
        ];
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        $status = $payload['status'] ?? '';
        $isVerified = ($status === 'Success' || $status === 'paid');

        return [
            'verified'       => $isVerified,
            'transaction_id' => $transactionId,
            'amount'         => (float) ($payload['amount'] ?? 0.00),
            'status'         => $isVerified ? 'paid' : 'failed',
            'raw_response'   => $payload,
        ];
    }

    public function processRefund(Order $order, float $amount, string $reason = ''): array
    {
        return [
            'success'   => true,
            'refund_id' => 'REF-NAGAD-' . strtoupper(Str::random(10)),
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'transaction_id' => $payload['paymentRefId'] ?? null,
            'status'         => ($payload['status'] ?? '') === 'Success' ? 'paid' : 'failed',
        ];
    }
}

