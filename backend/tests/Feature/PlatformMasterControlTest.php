<?php

namespace Tests\Feature;

use App\Models\Central\Plan;
use App\Models\Central\PlatformAdmin;
use App\Models\Central\PlatformAuditLog;
use App\Models\Central\Subscription;
use App\Models\Central\Tenant;
use App\Models\User;
use App\Tenancy\TenantProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlatformMasterControlTest extends TestCase
{
    use RefreshDatabase;

    protected string $testDbPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testDbPath = database_path('test_central_mcp.sqlite');
        config(['database.connections.central.database' => $this->testDbPath]);
        DB::purge('central');

        if (!file_exists($this->testDbPath)) {
            touch($this->testDbPath);
        }

        // Run Central Database Migrations
        $this->artisan('migrate:fresh', [
            '--path'     => 'database/migrations/central',
            '--database' => 'central',
        ]);
    }

    protected function tearDown(): void
    {
        DB::purge('central');
        if (file_exists($this->testDbPath)) {
            @unlink($this->testDbPath);
        }
        parent::tearDown();
    }

    protected function authenticateAdmin(): PlatformAdmin
    {
        $admin = PlatformAdmin::create([
            'name'           => 'Platform Super Admin',
            'email'          => 'admin@platform.test',
            'password'       => 'secret123',
            'is_super_admin' => true,
            'is_active'      => true,
        ]);
        Sanctum::actingAs($admin);
        return $admin;
    }

    public function test_sec_06_platform_health_diagnostics_uses_real_runtime_probes(): void
    {
        $this->authenticateAdmin();

        $response = $this->getJson('/api/v1/platform/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'central_database' => 'ok',
                    'cache'            => 'ok',
                    'storage'          => 'ok',
                ],
            ]);

        $this->assertIsNumeric($response->json('data.latency_ms'));
    }

    public function test_platform_kpis_calculates_real_metrics_from_central_db(): void
    {
        $this->authenticateAdmin();

        // 1. Create Plans
        $planStarter = Plan::create([
            'name'           => 'Starter',
            'slug'           => 'starter',
            'price'          => 2000.00,
            'billing_period' => 'monthly',
        ]);

        $planPro = Plan::create([
            'name'           => 'Pro',
            'slug'           => 'pro',
            'price'          => 60000.00,
            'billing_period' => 'yearly', // 60,000 / 12 = 5,000 / mo
        ]);

        // 2. Provision Tenants via TenantProvisioner
        $provisioner = new TenantProvisioner();
        $tenant1 = $provisioner->provision(['name' => 'Store Alpha', 'plan_id' => $planStarter->id]);
        $tenant2 = $provisioner->provision(['name' => 'Store Beta', 'plan_id' => $planPro->id]);

        // Mark subscriptions as active for MRR calculation
        Subscription::where('tenant_id', $tenant1->id)->update(['status' => 'active']);
        Subscription::where('tenant_id', $tenant2->id)->update(['status' => 'active']);

        // Create a suspended tenant
        $tenant3 = $provisioner->provision(['name' => 'Store Gamma']);
        $tenant3->update(['status' => 'suspended']);

        // 3. Query KPIs endpoint
        $response = $this->getJson('/api/v1/platform/kpis');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'tenants' => [
                        'total'     => 3,
                        'active'    => 2,
                        'suspended' => 1,
                    ],
                    'subscriptions' => [
                        'active' => 2,
                        'mrr'    => 7000.00, // 2000 (monthly) + 5000 (yearly/12)
                        'arr'    => 84000.00,
                    ],
                    'plans_count' => 2,
                ],
            ]);
    }

    public function test_tenant_lifecycle_provision_suspend_and_activate(): void
    {
        $admin = $this->authenticateAdmin();

        // 1. Provision New Tenant via API
        $createResponse = $this->postJson('/api/v1/platform/tenants', [
            'name'   => 'Luxe Silk Dhaka',
            'slug'   => 'luxe-silk',
            'domain' => 'luxesilk.com',
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Luxe Silk Dhaka')
            ->assertJsonPath('data.slug', 'luxe-silk')
            ->assertJsonPath('data.status', 'active');

        $tenantId = $createResponse->json('data.id');

        // Verify audit log for tenant.created
        $this->assertDatabaseHas('platform_audit_logs', [
            'tenant_id' => $tenantId,
            'action'    => 'tenant.created',
        ], 'central');

        // 2. Suspend Tenant
        $suspendResponse = $this->postJson("/api/v1/platform/tenants/{$tenantId}/suspend");
        $suspendResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('platform_audit_logs', [
            'tenant_id' => $tenantId,
            'action'    => 'tenant.suspended',
        ], 'central');

        // 3. Reactivate Tenant
        $activateResponse = $this->postJson("/api/v1/platform/tenants/{$tenantId}/activate");
        $activateResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('platform_audit_logs', [
            'tenant_id' => $tenantId,
            'action'    => 'tenant.activated',
        ], 'central');
    }

    public function test_plan_management_crud(): void
    {
        $this->authenticateAdmin();

        // 1. Create new Plan via API
        $createResponse = $this->postJson('/api/v1/platform/plans', [
            'name'           => 'Enterprise Tier',
            'slug'           => 'enterprise',
            'price'          => 15000.00,
            'billing_period' => 'monthly',
            'features_json'  => ['custom_domains' => true, 'dedicated_db' => true],
            'limits_json'    => ['products' => 50000],
            'is_active'      => true,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Enterprise Tier');

        $planId = $createResponse->json('data.id');

        // 2. Update Plan
        $updateResponse = $this->putJson("/api/v1/platform/plans/{$planId}", [
            'price' => 18000.00,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.price', '18000.00');

        // 3. List Plans
        $listResponse = $this->getJson('/api/v1/platform/plans');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_platform_audit_logs_endpoint(): void
    {
        $this->authenticateAdmin();

        // Seed an audit log
        PlatformAuditLog::create([
            'action'          => 'system.initialized',
            'target_resource' => 'platform:core',
            'payload'         => ['status' => 'ready'],
        ]);

        $response = $this->getJson('/api/v1/platform/audit-logs');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.data');
    }
}
