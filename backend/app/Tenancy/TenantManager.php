<?php

namespace App\Tenancy;

use App\Edition\EditionManager;
use App\Models\Central\Tenant;
use App\Models\Central\TenantDomain;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TenantManager
{
    protected ?TenantContext $currentContext = null;

    public function __construct(
        protected EditionManager $editionManager
    ) {}

    /**
     * Resolve and initialize a tenant from an incoming hostname/domain.
     */
    public function resolveFromHostname(string $host): ?TenantContext
    {
        // 1. In standalone mode, multi-tenancy routing is bypassed
        if ($this->editionManager->isStandalone()) {
            return null;
        }

        // 2. Normalize hostname (strip port if present)
        $domain = strtolower(explode(':', $host)[0]);

        // 3. Query Central Database for verified domain mapping
        $domainRecord = TenantDomain::query()
            ->where('domain', $domain)
            ->where('is_verified', true)
            ->with(['tenant.databaseConfig'])
            ->first();

        if (!$domainRecord || !$domainRecord->tenant) {
            return null;
        }

        return $this->initializeTenant($domainRecord->tenant, $domain);
    }

    /**
     * Initialize tenant context and switch runtime database connection.
     */
    public function initializeTenant(Tenant $tenant, string $resolvedDomain = ''): TenantContext
    {
        $dbConfig = [];

        if ($tenant->databaseConfig) {
            $dbConfig = [
                'driver'   => $tenant->databaseConfig->driver,
                'host'     => $tenant->databaseConfig->host,
                'port'     => $tenant->databaseConfig->port,
                'database' => $tenant->databaseConfig->database_name,
                'username' => $tenant->databaseConfig->username,
                'password' => $tenant->databaseConfig->getDecryptedPassword(),
            ];

            // Reconfigure tenant database connection dynamically
            Config::set('database.connections.tenant.driver', $dbConfig['driver']);
            Config::set('database.connections.tenant.host', $dbConfig['host']);
            Config::set('database.connections.tenant.port', $dbConfig['port']);
            Config::set('database.connections.tenant.database', $dbConfig['database']);
            Config::set('database.connections.tenant.username', $dbConfig['username']);
            Config::set('database.connections.tenant.password', $dbConfig['password']);

            DB::purge('tenant');
            DB::reconnect('tenant');
        }

        // Scope cache prefix per tenant to prevent collisions
        Config::set('cache.prefix', 'tenant_' . $tenant->id . '_');

        $this->currentContext = new TenantContext(
            tenant: $tenant,
            resolvedDomain: $resolvedDomain ?: ($tenant->slug . '.' . config('centerpoint.tenancy.domain_suffix')),
            databaseConfig: $dbConfig
        );

        return $this->currentContext;
    }

    /**
     * Check if a tenant context is currently active.
     */
    public function hasTenant(): bool
    {
        return $this->currentContext !== null;
    }

    /**
     * Get the active tenant context.
     */
    public function getTenantContext(): ?TenantContext
    {
        return $this->currentContext;
    }

    /**
     * Get the active tenant entity.
     */
    public function getTenant(): ?Tenant
    {
        return $this->currentContext?->tenant;
    }

    /**
     * Clear and reset tenant context.
     */
    public function resetTenantContext(): void
    {
        $this->currentContext = null;
        DB::purge('tenant');
    }
}

