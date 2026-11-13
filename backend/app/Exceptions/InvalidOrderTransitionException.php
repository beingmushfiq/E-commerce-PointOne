<?php

namespace App\Exceptions;

use Exception;

class InvalidOrderTransitionException extends Exception
{
    public function __construct(
        string $message = "Invalid order state transition.",
        public readonly string $fromStatus = '',
        public readonly string $toStatus = ''
    ) {
        parent::__construct($message);
    }
}

