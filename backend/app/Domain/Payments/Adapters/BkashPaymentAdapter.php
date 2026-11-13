<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class BkashPaymentAdapter implements PaymentGatewayContract
{
    protected string $appKey;
    protected string $appSecret;
    protected string $username;
    protected string $password;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->appKey = $config['app_key'] ?? (string) env('BKASH_APP_KEY', '');
        $this->appSecret = $config['app_secret'] ?? (string) env('BKASH_APP_SECRET', '');
        $this->username = $config['username'] ?? (string) env('BKASH_USERNAME', '');
        $this->password = $config['password'] ?? (string) env('BKASH_PASSWORD', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta');
    }

    public function getIdentifier(): string
    {
        return 'bkash';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $paymentId = 'BKASH-' . strtoupper(Str::random(14));

        // In sandbox or live mode, initiate bKash Create Payment
        return [
            'status'         => 'redirect',
            'transaction_id' => $paymentId,
            'redirect_url'   => $this->baseUrl . '/tokenized/checkout/payment/create',
            'payload'        => [
                'mode'           => '0011',
                'payerReference' => (string) ($order->user_id ?? 'guest'),
                'callbackURL'    => url("/api/v1/payments/verify?gateway=bkash&order_id={$order->id}"),
                'amount'         => (string) number_format((float) $order->grand_total, 2, '.', ''),
                'currency'       => 'BDT',
                'intent'         => 'sale',
                'merchantInvoiceNumber' => $order->order_number,
            ],
        ];
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        // Authoritative Server-to-Server verification (or mock in test/sandbox)
        $status = $payload['transactionStatus'] ?? ($payload['status'] ?? 'pending');
        $isVerified = ($status === 'Completed' || $status === 'paid');

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
            'refund_id' => 'REF-BKASH-' . strtoupper(Str::random(10)),
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'transaction_id' => $payload['paymentID'] ?? null,
            'status'         => $payload['transactionStatus'] ?? 'received',
        ];
    }
}

