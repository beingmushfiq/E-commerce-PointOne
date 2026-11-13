<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Role;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_access_admin_analytics_without_permission(): void
    {
        // Unprivileged customer user
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $response = $this->getJson('/api/v1/admin/analytics');

        // SEC-01 Remediation Verification: Must be Forbidden (403)
        $response->assertStatus(403)
            ->assertJsonPath('status', 'error');
    }

    public function test_customer_cannot_access_system_health(): void
    {
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $response = $this->getJson('/api/v1/admin/health');

        $response->assertStatus(403);
    }

    public function test_admin_can_fetch_admin_analytics(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin', 'guard_name' => 'web']);
        $admin->assignRole($adminRole);
        Sanctum::actingAs($admin);

        Order::create([
            'user_id' => $admin->id,
            'order_number' => 'ORD-12345',
            'status' => 'delivered',
            'payment_status' => 'paid',
            'payment_method' => 'stripe',
            'subtotal' => 100.00,
            'grand_total' => 110.00,
            'shipping_address' => ['full_name' => 'John'],
        ]);

        $response = $this->getJson('/api/v1/admin/analytics');

        $response->assertStatus(200)
            ->assertJsonPath('data.kpi.total_sales', 110)
            ->assertJsonPath('data.kpi.total_orders', 1);
    }

    public function test_admin_can_fetch_system_health(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin', 'guard_name' => 'web']);
        $admin->assignRole($adminRole);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/health');

        $response->assertStatus(200)
            ->assertJsonPath('data.database', 'ok');
    }
}
