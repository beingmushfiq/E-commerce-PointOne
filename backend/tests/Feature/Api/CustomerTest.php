<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_and_fetch_addresses(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/customer/addresses', [
            'type' => 'shipping',
            'full_name' => 'Jane Doe',
            'phone' => '+1234567890',
            'address_line_1' => '123 Enterprise St',
            'city' => 'Tech City',
            'postal_code' => '10001',
            'country' => 'USA',
            'is_default' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success', 'data' => ['city' => 'Tech City']]);

        $fetchResponse = $this->getJson('/api/v1/customer/addresses');
        $fetchResponse->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_customer_can_toggle_wishlist(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Gear', 'slug' => 'gear', 'is_active' => true]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Action Camera',
            'slug' => 'action-camera',
            'sku' => 'CAM-001',
            'price' => 299.99,
            'quantity' => 15,
            'is_active' => true,
        ]);

        // Add
        $response = $this->postJson('/api/v1/customer/wishlist/' . $product->id);
        $response->assertStatus(200)->assertJson(['in_wishlist' => true]);

        // Remove
        $removeResponse = $this->postJson('/api/v1/customer/wishlist/' . $product->id);
        $removeResponse->assertStatus(200)->assertJson(['in_wishlist' => false]);
    }
}
