<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_admin_analytics(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Order::create([
            'user_id' => $user->id,
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

    public function test_can_fetch_system_health(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/health');

        $response->assertStatus(200)
            ->assertJsonPath('data.database', 'ok');
    }
}
