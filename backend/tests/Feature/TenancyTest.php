<?php

namespace Tests\Feature;

use App\Edition\EditionManager;
use App\Models\Central\Plan;
use App\Models\Central\Tenant;
use App\Models\Central\TenantDomain;
use App\Tenancy\TenantManager;
use App\Tenancy\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $testDbPath = database_path('test_central.sqlite');
        config(['database.connections.central.database' => $testDbPath]);
        \Illuminate\Support\Facades\DB::purge('central');

        if (!file_exists($testDbPath)) {
            touch($testDbPath);
        }

        // Run Central Database Migrations
        $this->artisan('migrate:fresh', [
            '--path' => 'database/migrations/central',
            '--database' => 'central',
        ]);
    }

    protected function tearDown(): void
    {
        $testDbPath = database_path('test_central.sqlite');
        \Illuminate\Support\Facades\DB::purge('central');
        if (file_exists($testDbPath)) {
            @unlink($testDbPath);
        }
        parent::tearDown();
    }

    public function test_tenant_provisioner_creates_tenant_hierarchy(): void
    {
        // 1. Seed sample plan
        $plan = Plan::create([
            'name' => 'Growth Plan',
            'slug' => 'growth',
            'price' => 2500.00,
            'features_json' => ['ai_assistant' => true],
            'limits_json' => ['products' => 1000],
        ]);

        // 2. Provision Tenant
        $provisioner = new TenantProvisioner();
        $tenant = $provisioner->provision([
            'name' => 'Artisan Leather BD',
            'slug' => 'artisan-leather',
            'domain' => 'shop.artisanleather.com',
            'plan_id' => $plan->id,
            'db_driver' => 'sqlite',
        ]);

        // 3. Assertions
        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'slug' => 'artisan-leather',
            'status' => 'active',
        ], 'central');

        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'domain' => 'shop.artisanleather.com',
            'is_verified' => 1,
        ], 'central');

        $this->assertDatabaseHas('tenant_database_configs', [
            'tenant_id' => $tenant->id,
            'driver' => 'sqlite',
        ], 'central');

        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
        ], 'central');
    }

    public function test_tenant_manager_resolves_and_switches_connection(): void
    {
        $provisioner = new TenantProvisioner();
        $tenant = $provisioner->provision([
            'name' => 'Dhaka Craft Store',
            'slug' => 'dhaka-craft',
            'domain' => 'store.dhakacraft.com',
            'db_driver' => 'sqlite',
        ]);

        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);

        $context = $tenantManager->resolveFromHostname('store.dhakacraft.com');

        $this->assertNotNull($context);
        $this->assertEquals($tenant->id, $context->id());
        $this->assertEquals('dhaka-craft', $context->slug());
        $this->assertTrue($tenantManager->hasTenant());
        $this->assertEquals('tenant_' . $tenant->id . '_', config('cache.prefix'));

        $tenantManager->resetTenantContext();
        $this->assertFalse($tenantManager->hasTenant());
    }

    public function test_unrecognized_domain_returns_null_in_saas_mode(): void
    {
        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);

        $context = $tenantManager->resolveFromHostname('unknown-domain.com');

        $this->assertNull($context);
        $this->assertFalse($tenantManager->hasTenant());
    }

    public function test_standalone_edition_bypasses_tenant_resolution(): void
    {
        $editionManager = new EditionManager('standalone');
        $tenantManager = new TenantManager($editionManager);

        $context = $tenantManager->resolveFromHostname('store.dhakacraft.com');

        $this->assertNull($context);
        $this->assertFalse($tenantManager->hasTenant());
    }
}
