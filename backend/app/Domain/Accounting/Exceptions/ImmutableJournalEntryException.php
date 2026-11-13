<?php

namespace App\Domain\Accounting\Exceptions;

use Exception;

class ImmutableJournalEntryException extends Exception
{
    public function __construct(
        string $message = "Posted journal entries are strictly immutable. Corrections must be made via reversal entries."
    ) {
        parent::__construct($message);
    }
}

