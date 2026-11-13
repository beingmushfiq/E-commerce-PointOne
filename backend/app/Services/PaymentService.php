<?php

namespace App\Services;

use App\Domain\Payments\PaymentGatewayManager;
use App\Models\Order;
use App\Models\Payment;

class PaymentService
{
    public function __construct(
        protected PaymentGatewayManager $manager
    ) {}

    /**
     * Process payment via provider-independent gateway manager.
     */
    public function processPayment(Order $order, string $method, array $paymentDetails = []): Payment
    {
        return $this->manager->processPayment($order, $method, $paymentDetails);
    }

    /**
     * Authoritatively verify server-to-server payment.
     */
    public function verifyPayment(Order $order, string $method, string $transactionId, array $payload = []): Payment
    {
        return $this->manager->verifyPayment($order, $method, $transactionId, $payload);
    }
}
