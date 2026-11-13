<?php

namespace App\Domain\Payments\Exceptions;

use Exception;

class InvalidPaymentMethodException extends Exception
{
    public function __construct(
        string $message = "Unsupported or unconfigured payment gateway.",
        public readonly string $gateway = ''
    ) {
        parent::__construct($message);
    }
}

