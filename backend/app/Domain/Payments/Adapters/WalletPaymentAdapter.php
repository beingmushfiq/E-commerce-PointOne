<?php

namespace App\Domain\Payments\Adapters;

use App\Domain\Payments\Contracts\PaymentGatewayContract;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletPaymentAdapter implements PaymentGatewayContract
{
    public function getIdentifier(): string
    {
        return 'wallet';
    }

    public function initiatePayment(Order $order, array $params = []): array
    {
        $user = $order->user;
        $transactionId = 'WAL-' . strtoupper(Str::random(12));

        if (!$user || !$user->wallet || $user->wallet->balance < $order->grand_total) {
            return [
                'status'         => 'failed',
                'transaction_id' => $transactionId,
                'message'        => 'Insufficient wallet balance',
                'payload'        => ['available' => (float) ($user?->wallet?->balance ?? 0.00)],
            ];
        }

        return DB::transaction(function () use ($user, $order, $transactionId) {
            $user->wallet->decrement('balance', $order->grand_total);

            $user->wallet->transactions()->create([
                'type'        => 'debit',
                'amount'      => $order->grand_total,
                'reference'   => $order->order_number,
                'description' => "Payment for Order #{$order->order_number}",
            ]);

            return [
                'status'         => 'completed',
                'transaction_id' => $transactionId,
                'payload'        => [
                    'debited_amount' => (float) $order->grand_total,
                    'remaining'      => (float) $user->wallet->fresh()->balance,
                ],
            ];
        });
    }

    public function verifyPayment(string $transactionId, array $payload = []): array
    {
        return [
            'verified'       => true,
            'transaction_id' => $transactionId,
            'amount'         => (float) ($payload['amount'] ?? 0.00),
            'status'         => 'paid',
            'raw_response'   => $payload,
        ];
    }

    public function processRefund(Order $order, float $amount, string $reason = ''): array
    {
        $user = $order->user;
        if (!$user || !$user->wallet) {
            return ['success' => false, 'message' => 'Customer wallet not found'];
        }

        $refundId = 'REF-WAL-' . strtoupper(Str::random(10));

        DB::transaction(function () use ($user, $order, $amount, $reason, $refundId) {
            $user->wallet->increment('balance', $amount);
            $user->wallet->transactions()->create([
                'type'        => 'credit',
                'amount'      => $amount,
                'reference'   => $refundId,
                'description' => "Refund for Order #{$order->order_number}: {$reason}",
            ]);
        });

        return [
            'success'   => true,
            'refund_id' => $refundId,
            'amount'    => $amount,
        ];
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return ['handled' => true, 'status' => 'acknowledged'];
    }
}

