<?php

namespace App\Edition;

use App\Edition\Contracts\EditionContract;

class StandaloneEdition implements EditionContract
{
    protected array $features;

    public function __construct(array $features = [])
    {
        $this->features = $features;
    }

    public function getName(): string
    {
        return 'standalone';
    }

    public function isMultiTenant(): bool
    {
        return false;
    }

    public function hasMasterControl(): bool
    {
        return false;
    }

    public function requiresCentralBilling(): bool
    {
        return false;
    }

    public function hasFeature(string $feature): bool
    {
        // Standalone license grants full access to configured local features
        return $this->features[$feature] ?? true;
    }
}

