<?php

namespace App\Domain\Payments\Contracts;

use App\Models\Order;

interface PaymentGatewayContract
{
    /**
     * Get unique gateway identifier (e.g. 'cod', 'wallet', 'bkash', 'sslcommerz', 'nagad', 'test').
     */
    public function getIdentifier(): string;

    /**
     * Initiate payment transaction for the given order.
     *
     * @return array{
     *     status: 'pending'|'completed'|'redirect',
     *     transaction_id: string,
     *     redirect_url?: string,
     *     payload?: array
     * }
     */
    public function initiatePayment(Order $order, array $params = []): array;

    /**
     * Verify payment directly via authoritative server-side query.
     *
     * @return array{
     *     verified: bool,
     *     transaction_id: string,
     *     amount: float,
     *     status: 'paid'|'failed'|'pending',
     *     raw_response?: array
     * }
     */
    public function verifyPayment(string $transactionId, array $payload = []): array;

    /**
     * Process customer refund.
     *
     * @return array{
     *     success: bool,
     *     refund_id?: string,
     *     amount: float
     * }
     */
    public function processRefund(Order $order, float $amount, string $reason = ''): array;

    /**
     * Process incoming webhook callback with cryptographic signature validation.
     *
     * @return array{
     *     handled: bool,
     *     order_id?: int,
     *     transaction_id?: string,
     *     status?: string
     * }
     */
    public function handleWebhook(array $payload, array $headers = []): array;
}

