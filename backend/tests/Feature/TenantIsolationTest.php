<?php

namespace Tests\Feature;

use App\Edition\EditionManager;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\RequireTenantContext;
use App\Http\Middleware\ResolveTenant;
use App\Models\Central\Tenant;
use App\Models\Central\TenantDatabaseConfig;
use App\Models\Central\TenantDomain;
use App\Tenancy\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected string $centralDbPath;
    protected string $tenantADbPath;
    protected string $tenantBDbPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->centralDbPath = database_path('test_isolation_central.sqlite');
        $this->tenantADbPath = database_path('test_isolation_tenant_a.sqlite');
        $this->tenantBDbPath = database_path('test_isolation_tenant_b.sqlite');

        config(['database.connections.central.database' => $this->centralDbPath]);
        DB::purge('central');

        foreach ([$this->centralDbPath, $this->tenantADbPath, $this->tenantBDbPath] as $path) {
            if (!file_exists($path)) {
                touch($path);
            }
        }

        // Run Central Migrations
        $this->artisan('migrate:fresh', [
            '--path'     => 'database/migrations/central',
            '--database' => 'central',
        ]);
    }

    protected function tearDown(): void
    {
        DB::purge('central');
        DB::purge('tenant');

        foreach ([$this->centralDbPath, $this->tenantADbPath, $this->tenantBDbPath] as $path) {
            if (file_exists($path)) {
                @unlink($path);
            }
        }

        parent::tearDown();
    }

    public function test_unrecognized_or_spoofed_host_header_is_rejected_with_404_in_saas_mode(): void
    {
        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);
        $middleware = new ResolveTenant($tenantManager, $editionManager);

        $request = Request::create('https://spoofed-or-unregistered-store.com/api/v1/products', 'GET');

        $response = $middleware->handle($request, function () {
            return response()->json(['status' => 'ok']);
        });

        $this->assertEquals(404, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('error', $content['status']);
        $this->assertStringContainsString('Tenant domain is not recognized', $content['message']);
    }

    public function test_suspended_tenant_is_blocked_with_403(): void
    {
        $tenant = Tenant::create([
            'id'     => (string) \Illuminate\Support\Str::uuid(),
            'name'   => 'Suspended Merchant',
            'slug'   => 'suspended-merchant',
            'status' => 'suspended',
        ]);

        TenantDomain::create([
            'tenant_id'   => $tenant->id,
            'domain'      => 'suspended.centerpoint.test',
            'is_primary'  => true,
            'is_verified' => true,
        ]);

        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);

        // 1. ResolveTenant initializes suspended tenant
        $resolveMiddleware = new ResolveTenant($tenantManager, $editionManager);
        $request = Request::create('https://suspended.centerpoint.test/api/v1/checkout', 'POST');

        $resolveMiddleware->handle($request, function () {
            return response()->json(['status' => 'ok']);
        });

        // 2. EnsureTenantIsActive blocks execution
        $activeMiddleware = new EnsureTenantIsActive($tenantManager, $editionManager);
        $response = $activeMiddleware->handle($request, function () {
            return response()->json(['status' => 'ok']);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('error', $content['status']);
        $this->assertStringContainsString('suspended', $content['message']);
    }

    public function test_missing_tenant_context_is_blocked_by_require_tenant_context_middleware(): void
    {
        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);
        $middleware = new RequireTenantContext($tenantManager, $editionManager);

        $request = Request::create('https://centerpoint.test/api/v1/orders', 'GET');

        $response = $middleware->handle($request, function () {
            return response()->json(['status' => 'ok']);
        });

        $this->assertEquals(403, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('error', $content['status']);
        $this->assertStringContainsString('requires an initialized tenant context', $content['message']);
    }

    public function test_standalone_edition_bypasses_central_resolution_and_passes_through(): void
    {
        $editionManager = new EditionManager('standalone');
        $tenantManager = new TenantManager($editionManager);

        $resolveMiddleware = new ResolveTenant($tenantManager, $editionManager);
        $requireMiddleware = new RequireTenantContext($tenantManager, $editionManager);

        $request = Request::create('https://any-domain.local/api/v1/products', 'GET');

        $passedResolve = false;
        $resolveMiddleware->handle($request, function () use (&$passedResolve) {
            $passedResolve = true;
            return response()->json(['status' => 'ok']);
        });
        $this->assertTrue($passedResolve);

        $passedRequire = false;
        $requireMiddleware->handle($request, function () use (&$passedRequire) {
            $passedRequire = true;
            return response()->json(['status' => 'ok']);
        });
        $this->assertTrue($passedRequire);
    }

    public function test_strict_cross_tenant_database_isolation(): void
    {
        // 1. Create Tenant A
        $tenantA = Tenant::create([
            'id'     => (string) \Illuminate\Support\Str::uuid(),
            'name'   => 'Tenant Alpha Luxury',
            'slug'   => 'tenant-alpha',
            'status' => 'active',
        ]);
        TenantDomain::create([
            'tenant_id'   => $tenantA->id,
            'domain'      => 'alpha.centerpoint.test',
            'is_primary'  => true,
            'is_verified' => true,
        ]);
        TenantDatabaseConfig::create([
            'tenant_id'          => $tenantA->id,
            'driver'             => 'sqlite',
            'host'               => '127.0.0.1',
            'port'               => 3306,
            'database_name'      => $this->tenantADbPath,
            'username'           => 'default',
            'encrypted_password' => 'secret',
        ]);

        // 2. Create Tenant B
        $tenantB = Tenant::create([
            'id'     => (string) \Illuminate\Support\Str::uuid(),
            'name'   => 'Tenant Beta Wholesale',
            'slug'   => 'tenant-beta',
            'status' => 'active',
        ]);
        TenantDomain::create([
            'tenant_id'   => $tenantB->id,
            'domain'      => 'beta.centerpoint.test',
            'is_primary'  => true,
            'is_verified' => true,
        ]);
        TenantDatabaseConfig::create([
            'tenant_id'          => $tenantB->id,
            'driver'             => 'sqlite',
            'host'               => '127.0.0.1',
            'port'               => 3306,
            'database_name'      => $this->tenantBDbPath,
            'username'           => 'default',
            'encrypted_password' => 'secret',
        ]);

        // 3. Set up schema in both tenant SQLite databases
        $tenantSchema = function ($dbPath) {
            $pdo = new \PDO("sqlite:{$dbPath}");
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $pdo->exec("CREATE TABLE IF NOT EXISTS sample_products (id INTEGER PRIMARY KEY, name TEXT, sku TEXT)");
            return $pdo;
        };

        $pdoA = $tenantSchema($this->tenantADbPath);
        $pdoA->exec("INSERT INTO sample_products (name, sku) VALUES ('Alpha Emerald Chrono', 'ALPHA-001')");

        $pdoB = $tenantSchema($this->tenantBDbPath);
        $pdoB->exec("INSERT INTO sample_products (name, sku) VALUES ('Beta Sapphire Ring', 'BETA-001')");

        $editionManager = new EditionManager('saas');
        $tenantManager = new TenantManager($editionManager);

        // 4. Resolve Tenant A and verify DB query isolated to DB A
        $contextA = $tenantManager->resolveFromHostname('alpha.centerpoint.test');
        $this->assertNotNull($contextA);
        $this->assertEquals($tenantA->id, $contextA->id());

        $productsA = DB::connection('tenant')->table('sample_products')->get();
        $this->assertCount(1, $productsA);
        $this->assertEquals('Alpha Emerald Chrono', $productsA->first()->name);
        $this->assertEquals('ALPHA-001', $productsA->first()->sku);

        // 5. Resolve Tenant B and verify DB query isolated to DB B
        $contextB = $tenantManager->resolveFromHostname('beta.centerpoint.test');
        $this->assertNotNull($contextB);
        $this->assertEquals($tenantB->id, $contextB->id());

        $productsB = DB::connection('tenant')->table('sample_products')->get();
        $this->assertCount(1, $productsB);
        $this->assertEquals('Beta Sapphire Ring', $productsB->first()->name);
        $this->assertEquals('BETA-001', $productsB->first()->sku);

        // 6. Reset context and verify tenant disconnection
        $tenantManager->resetTenantContext();
        $this->assertFalse($tenantManager->hasTenant());
    }
}
