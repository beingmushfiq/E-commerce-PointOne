<?php

namespace App\Domain\Payments;

use App\Domain\Payments\Adapters\BkashPaymentAdapter;
use App\Domain\Payments\Adapters\CodPaymentAdapter;
use App\Domain\Payments\Adapters\NagadPaymentAdapter;
use App\Domain\Payments\Adapters\SslCommerzPaymentAdapter;
use App\Domain\Payments\Adapters\TestPaymentAdapter;
use App\Domain\Payments\Adapters\WalletPaymentAdapter;
use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Domain\Payments\Exceptions\InvalidPaymentMethodException;
use App\Models\Order;
use App\Models\Payment;
use App\Domain\Accounting\Services\CommerceLedgerBridge;
use App\Models\PaymentIdempotencyKey;
use Illuminate\Support\Facades\DB;

class PaymentGatewayManager
{
    /** @var array<string, PaymentGatewayContract> */
    protected array $adapters = [];

    public function __construct(
        protected ?CommerceLedgerBridge $ledgerBridge = null
    ) {
        $this->registerDefaultAdapters();
    }

    protected function registerDefaultAdapters(): void
    {
        $this->adapters['cod'] = new CodPaymentAdapter();
        $this->adapters['wallet'] = new WalletPaymentAdapter();
        $this->adapters['bkash'] = new BkashPaymentAdapter();
        $this->adapters['sslcommerz'] = new SslCommerzPaymentAdapter();
        $this->adapters['nagad'] = new NagadPaymentAdapter();
        $this->adapters['test'] = new TestPaymentAdapter(true);
    }

    public function registerAdapter(string $name, PaymentGatewayContract $adapter): void
    {
        $this->adapters[strtolower($name)] = $adapter;
    }

    /**
     * Resolve the requested gateway adapter.
     *
     * @throws InvalidPaymentMethodException
     */
    public function resolve(string $gateway): PaymentGatewayContract
    {
        $key = strtolower($gateway);

        if (!isset($this->adapters[$key])) {
            // SEC-02 Fix: Strictly reject unhandled payment methods!
            throw new InvalidPaymentMethodException(
                "Payment method [{$gateway}] is not supported or active.",
                gateway: $gateway
            );
        }

        return $this->adapters[$key];
    }

    /**
     * Initiate and process payment using the appropriate adapter.
     *
     * @throws InvalidPaymentMethodException
     */
    public function processPayment(Order $order, string $method, array $paymentDetails = []): Payment
    {
        $adapter = $this->resolve($method);
        $result = $adapter->initiatePayment($order, $paymentDetails);

        $status = match ($result['status']) {
            'completed' => 'completed',
            'pending', 'redirect' => 'pending',
            default => 'failed',
        };

        return DB::transaction(function () use ($order, $method, $result, $status) {
            $payment = Payment::create([
                'order_id'       => $order->id,
                'payment_method' => $method,
                'transaction_id' => $result['transaction_id'],
                'amount'         => $order->grand_total,
                'status'         => $status,
                'payload'        => $result['payload'] ?? [],
            ]);

            if ($status === 'completed') {
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => 'processing',
                ]);

                // Record double-entry accounting posting
                $this->ledgerBridge?->recordOrderPayment($order, $payment);
            }

            return $payment;
        });
    }

    /**
     * Authoritatively verify an incoming payment with server-to-server validation & idempotency.
     */
    public function verifyPayment(Order $order, string $method, string $transactionId, array $payload = []): Payment
    {
        $adapter = $this->resolve($method);
        $verification = $adapter->verifyPayment($transactionId, $payload);

        // Check or record idempotency key
        $idempotencyKey = "{$method}:{$transactionId}";
        $idempotency = PaymentIdempotencyKey::firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'provider'         => $method,
                'order_id'         => $order->id,
                'status'           => $verification['verified'] ? 'completed' : 'failed',
                'response_payload' => $verification,
            ]
        );

        return DB::transaction(function () use ($order, $method, $transactionId, $verification) {
            $payment = Payment::where('order_id', $order->id)
                ->where('transaction_id', $transactionId)
                ->first();

            if (!$payment) {
                $payment = Payment::create([
                    'order_id'       => $order->id,
                    'payment_method' => $method,
                    'transaction_id' => $transactionId,
                    'amount'         => $verification['amount'] ?: $order->grand_total,
                    'status'         => $verification['verified'] ? 'completed' : 'failed',
                    'payload'        => $verification['raw_response'] ?? [],
                ]);
            } else {
                $payment->update([
                    'status'  => $verification['verified'] ? 'completed' : 'failed',
                    'payload' => $verification['raw_response'] ?? [],
                ]);
            }

            if ($verification['verified']) {
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => 'processing',
                ]);

                // Record double-entry accounting posting
                $this->ledgerBridge?->recordOrderPayment($order, $payment);
            }

            return $payment;
        });
    }
}

