<?php

namespace App\Domain\Accounting\Exceptions;

use Exception;

class UnbalancedJournalEntryException extends Exception
{
    public function __construct(
        string $message = "Journal entry is unbalanced. Total debits must strictly equal total credits.",
        public float $totalDebits = 0.0,
        public float $totalCredits = 0.0
    ) {
        parent::__construct("{$message} (Debits: {$totalDebits}, Credits: {$totalCredits})");
    }
}

