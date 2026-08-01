<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_add_item_to_cart_and_process_checkout(): void
    {
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio', 'is_active' => true]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Wireless Headphones',
            'slug' => 'wireless-headphones',
            'sku' => 'AUD-001',
            'price' => 150.00,
            'quantity' => 20,
            'is_active' => true,
        ]);

        // Add to cart
        $addResponse = $this->postJson('/api/v1/cart/add', [
            'product_id' => $product->id,
            'quantity' => 2,
        ], ['X-Session-ID' => 'test-session-123']);

        $addResponse->assertStatus(200)
            ->assertJsonPath('data.total_amount', '300.00');

        // Process Checkout
        $checkoutResponse = $this->postJson('/api/v1/checkout/process', [
            'payment_method' => 'cod',
            'shipping_address' => [
                'full_name' => 'John Doe',
                'phone' => '+123456789',
                'address_line_1' => '456 Tech Ave',
                'city' => 'Metropolis',
                'country' => 'USA',
            ]
        ], ['X-Session-ID' => 'test-session-123']);

        $checkoutResponse->assertStatus(201)
            ->assertJsonPath('data.order.subtotal', '300.00')
            ->assertJsonPath('data.order.grand_total', '350.00');

        $this->assertDatabaseHas('orders', ['subtotal' => 300.00]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'quantity' => 18]);
    }
}
