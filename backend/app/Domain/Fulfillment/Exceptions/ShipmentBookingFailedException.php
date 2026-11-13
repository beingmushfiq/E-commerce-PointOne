<?php

namespace App\Domain\Fulfillment\Exceptions;

use Exception;

class ShipmentBookingFailedException extends Exception
{
    public function __construct(
        string $message = "Failed to book delivery shipment with courier provider.",
        public readonly string $courier = '',
        public readonly array $responsePayload = []
    ) {
        parent::__construct($message);
    }
}

