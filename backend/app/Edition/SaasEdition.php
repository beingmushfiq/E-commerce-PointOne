<?php

namespace App\Edition;

use App\Edition\Contracts\EditionContract;

class SaasEdition implements EditionContract
{
    protected array $features;

    public function __construct(array $features = [])
    {
        $this->features = $features;
    }

    public function getName(): string
    {
        return 'saas';
    }

    public function isMultiTenant(): bool
    {
        return true;
    }

    public function hasMasterControl(): bool
    {
        return true;
    }

    public function requiresCentralBilling(): bool
    {
        return true;
    }

    public function hasFeature(string $feature): bool
    {
        return $this->features[$feature] ?? false;
    }
}

