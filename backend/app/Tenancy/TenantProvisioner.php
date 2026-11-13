<?php

namespace App\Tenancy;

use App\Models\Central\Plan;
use App\Models\Central\Subscription;
use App\Models\Central\Tenant;
use App\Models\Central\TenantDatabaseConfig;
use App\Models\Central\TenantDomain;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class TenantProvisioner
{
    /**
     * Provision a complete tenant record, domain routing, and database configuration.
     *
     * @param array{
     *     name: string,
     *     slug: string,
     *     domain?: string,
     *     plan_id?: int,
     *     edition?: string,
     *     db_driver?: string
     * } $data
     */
    public function provision(array $data): Tenant
    {
        $slug = Str::slug($data['slug'] ?? $data['name']);

        if (Tenant::where('slug', $slug)->exists()) {
            throw new InvalidArgumentException("Tenant slug [{$slug}] is already registered.");
        }

        $tenantId = (string) Str::uuid();
        $domain = strtolower($data['domain'] ?? ($slug . '.' . config('centerpoint.tenancy.domain_suffix')));

        return DB::connection('central')->transaction(function () use ($data, $tenantId, $slug, $domain) {
            // 1. Create Central Tenant Record
            $tenant = Tenant::create([
                'id'      => $tenantId,
                'name'    => $data['name'],
                'slug'    => $slug,
                'status'  => 'active',
                'edition' => $data['edition'] ?? 'saas',
                'data'    => ['provisioned_at' => now()->toIso8601String()],
            ]);

            // 2. Register Primary Domain
            TenantDomain::create([
                'tenant_id'   => $tenantId,
                'domain'      => $domain,
                'is_primary'  => true,
                'is_verified' => true,
                'verified_at' => now(),
            ]);

            // 3. Configure Database Connection Metadata
            $driver = $data['db_driver'] ?? config('database.default', 'sqlite');
            $dbName = $driver === 'sqlite' 
                ? database_path("tenant_{$slug}.sqlite")
                : ('tenant_' . str_replace('-', '_', $slug));

            if ($driver === 'sqlite' && !file_exists($dbName)) {
                touch($dbName);
            }

            TenantDatabaseConfig::create([
                'tenant_id'          => $tenantId,
                'driver'             => $driver,
                'host'               => config("database.connections.{$driver}.host", '127.0.0.1'),
                'port'               => config("database.connections.{$driver}.port", 3306),
                'database_name'      => $dbName,
                'username'           => config("database.connections.{$driver}.username", 'root'),
                'encrypted_password' => (string) config("database.connections.{$driver}.password", ''),
            ]);

            // 4. Attach Default Plan & Subscription if plan exists
            $planId = $data['plan_id'] ?? null;
            if (!$planId) {
                $defaultPlan = Plan::first();
                $planId = $defaultPlan?->id;
            }

            if ($planId) {
                Subscription::create([
                    'tenant_id'            => $tenantId,
                    'plan_id'              => $planId,
                    'status'               => 'trialing',
                    'trial_ends_at'        => now()->addDays(14),
                    'current_period_start' => now(),
                    'current_period_end'   => now()->addMonth(),
                ]);
            }

            return $tenant->load(['domains', 'databaseConfig', 'activeSubscription.plan']);
        });
    }
}

