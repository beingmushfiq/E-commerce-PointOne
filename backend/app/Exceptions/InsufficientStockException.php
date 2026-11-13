<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(
        string $message = "Insufficient stock available for the requested product.",
        public readonly int $productId = 0,
        public readonly int $requestedQuantity = 0,
        public readonly int $availableQuantity = 0
    ) {
        parent::__construct($message);
    }
}

