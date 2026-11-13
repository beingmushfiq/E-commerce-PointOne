<?php

namespace App\Edition;

use App\Edition\Contracts\EditionContract;
use InvalidArgumentException;

class EditionManager
{
    protected EditionContract $currentEdition;

    public function __construct(string $editionName, array $features = [])
    {
        $this->currentEdition = match (strtolower($editionName)) {
            'saas'       => new SaasEdition($features),
            'standalone' => new StandaloneEdition($features),
            'enterprise' => new StandaloneEdition(array_merge($features, ['multiple_storefronts' => true])),
            default      => throw new InvalidArgumentException("Unsupported CENTERPOINT edition: [{$editionName}]"),
        };
    }

    public function getEdition(): EditionContract
    {
        return $this->currentEdition;
    }

    public function isMultiTenant(): bool
    {
        return $this->currentEdition->isMultiTenant();
    }

    public function isStandalone(): bool
    {
        return !$this->currentEdition->isMultiTenant();
    }

    public function hasMasterControl(): bool
    {
        return $this->currentEdition->hasMasterControl();
    }

    public function hasFeature(string $feature): bool
    {
        return $this->currentEdition->hasFeature($feature);
    }
}

