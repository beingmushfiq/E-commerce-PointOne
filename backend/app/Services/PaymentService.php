<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentService
{
    public function processPayment(Order $order, string $method, array $paymentDetails = []): Payment
    {
        $transactionId = strtoupper($method) . '-' . Str::random(12);

        // Simulation/Gateway integration router
        $status = match($method) {
            'cod' => 'pending',
            'wallet' => $this->deductWallet($order),
            default => 'completed',
        };

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => $method,
            'transaction_id' => $transactionId,
            'amount' => $order->grand_total,
            'status' => $status,
            'payload' => $paymentDetails,
        ]);

        if ($status === 'completed') {
            $order->update(['payment_status' => 'paid', 'status' => 'processing']);
        }

        return $payment;
    }

    private function deductWallet(Order $order): string
    {
        $user = $order->user;
        if (!$user || !$user->wallet || $user->wallet->balance < $order->grand_total) {
            return 'failed';
        }

        $user->wallet->decrement('balance', $order->grand_total);
        $user->wallet->transactions()->create([
            'type' => 'debit',
            'amount' => $order->grand_total,
            'reference' => $order->order_number,
            'description' => 'Payment for Order #' . $order->order_number,
        ]);

        return 'completed';
    }
}
