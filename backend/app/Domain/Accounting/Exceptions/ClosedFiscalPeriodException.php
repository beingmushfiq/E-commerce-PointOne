<?php

namespace App\Domain\Accounting\Exceptions;

use Exception;

class ClosedFiscalPeriodException extends Exception
{
    public function __construct(
        string $message = "Cannot post or modify transactions in a closed fiscal period."
    ) {
        parent::__construct($message);
    }
}

