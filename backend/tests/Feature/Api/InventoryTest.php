<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Warehouse;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_warehouse_and_fetch_list(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

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

    public function test_can_create_supplier(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/inventory/suppliers', [
            'name' => 'Tech Wholesale Inc',
            'email' => 'contact@techwholesale.com',
            'company_name' => 'Tech Wholesale LLC',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Tech Wholesale Inc');
    }
}
