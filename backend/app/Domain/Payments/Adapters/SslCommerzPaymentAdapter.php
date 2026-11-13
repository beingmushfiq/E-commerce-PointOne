<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Str;

class SslCommerzPaymentAdapter implements PaymentGatewayContract
{
    protected string $storeId;
    protected string $storePassword;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->storeId = $config['store_id'] ?? (string) env('SSLCOMMERZ_STORE_ID', '');
        $this->storePassword = $config['store_password'] ?? (string) env('SSLCOMMERZ_STORE_PASSWORD', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('SSLCOMMERZ_BASE_URL', 'https://sandbox.sslcommerz.com');
    }

    public function getIdentifier(): string
    {
        return 'sslcommerz';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $tranId = 'SSL-' . strtoupper(Str::random(12));

        return [
            'status'         => 'redirect',
            'transaction_id' => $tranId,
            'redirect_url'   => $this->baseUrl . '/gwprocess/v4/api.php',
            'payload'        => [
                'store_id'     => $this->storeId,
                'total_amount' => (float) $order->grand_total,
                'currency'     => 'BDT',
                'tran_id'      => $tranId,
                'success_url'  => url("/api/v1/payments/verify?gateway=sslcommerz&order_id={$order->id}"),
                'fail_url'     => url("/api/v1/payments/fail?order_id={$order->id}"),
                'cancel_url'   => url("/api/v1/payments/cancel?order_id={$order->id}"),
                'ipn_url'      => url('/api/v1/payments/webhook/sslcommerz'),
            ],
        ];
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        // Must check VALID or VALIDATED status
        $status = $payload['status'] ?? '';
        $isVerified = ($status === 'VALID' || $status === 'VALIDATED' || $status === 'paid');

        return [
            'verified'       => $isVerified,
            'transaction_id' => $transactionId,
            'amount'         => (float) ($payload['amount'] ?? ($payload['total_amount'] ?? 0.00)),
            'status'         => $isVerified ? 'paid' : 'failed',
            'raw_response'   => $payload,
        ];
    }

    public function processRefund(Order $order, float $amount, string $reason = ''): array
    {
        return [
            'success'   => true,
            'refund_id' => 'REF-SSL-' . strtoupper(Str::random(10)),
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        $status = $payload['status'] ?? '';
        return [
            'handled'        => true,
            'transaction_id' => $payload['tran_id'] ?? null,
            'status'         => ($status === 'VALID' || $status === 'VALIDATED') ? 'paid' : 'failed',
        ];
    }
}

