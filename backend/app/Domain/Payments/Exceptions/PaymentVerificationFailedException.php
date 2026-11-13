<?php

namespace App\Domain\Payments\Exceptions;

use Exception;

class PaymentVerificationFailedException extends Exception
{
    public function __construct(
        string $message = "Payment verification failed or returned unauthorized.",
        public readonly string $transactionId = '',
        public readonly array $gatewayResponse = []
    ) {
        parent::__construct($message);
    }
}

