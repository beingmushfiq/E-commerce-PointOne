<?php

namespace App\Tenancy;

use App\Models\Central\Tenant;

class TenantContext
{
    public function __construct(
        public readonly Tenant $tenant,
        public readonly string $resolvedDomain,
        public readonly array $databaseConfig = []
    ) {}

    public function id(): string
    {
        return $this->tenant->id;
    }

    public function slug(): string
    {
        return $this->tenant->slug;
    }

    public function name(): string
    {
        return $this->tenant->name;
    }

    public function isActive(): bool
    {
        return $this->tenant->status === 'active';
    }
}

