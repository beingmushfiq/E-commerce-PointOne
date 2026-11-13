<?php

namespace App\Edition\Contracts;

interface EditionContract
{
    /**
     * Get the formal edition identifier (e.g. 'saas', 'standalone', 'enterprise').
     */
    public function getName(): string;

    /**
     * Determine if multi-tenant dynamic database routing is active.
     */
    public function isMultiTenant(): bool;

    /**
     * Determine if the platform Master Control Panel is accessible.
     */
    public function hasMasterControl(): bool;

    /**
     * Determine if external license verification or central billing is required.
     */
    public function requiresCentralBilling(): bool;

    /**
     * Check if a specific feature entitlement is enabled.
     */
    public function hasFeature(string $feature): bool;
}

