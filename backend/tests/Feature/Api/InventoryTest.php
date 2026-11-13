<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Warehouse;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_manage_inventory(): void
    {
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/v1/inventory/warehouses', [
            'name' => 'Unauthorized Warehouse',
            'code' => 'WH-ROGUE',
        ]);

        // SEC-01 Remediation: Must be 403 Forbidden
        $response->assertStatus(403);
    }

    public function test_admin_can_create_warehouse_and_fetch_list(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin', 'guard_name' => 'web']);
        $admin->assignRole($adminRole);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/inventory/warehouses', [
            'name' => 'Main Warehouse',
            'code' => 'WH-001',
            'address' => '100 Logistics Way',
            'city' => 'New York',
            'country' => 'USA',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'WH-001');

        $fetchResponse = $this->getJson('/api/v1/inventory/warehouses');
        $fetchResponse->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_staff_with_permission_can_create_supplier(): void
    {
        $staff = User::factory()->create();
        $managerRole = Role::create(['name' => 'inventory_manager', 'display_name' => 'Inventory Manager', 'guard_name' => 'web']);
        $perm = Permission::create(['name' => 'manage-inventory', 'display_name' => 'Manage Inventory', 'group' => 'inventory', 'guard_name' => 'web']);
        $managerRole->permissions()->attach($perm->id);
        $staff->assignRole($managerRole);
        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/v1/inventory/suppliers', [
            'name' => 'Tech Wholesale Inc',
            'email' => 'contact@techwholesale.com',
            'company_name' => 'Tech Wholesale LLC',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Tech Wholesale Inc');
    }
}
