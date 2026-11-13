<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\StockReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_creates_order_with_immutable_snapshot(): void
    {
        $category = Category::create(['name' => 'Tech', 'slug' => 'tech']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Mechanical Keyboard',
            'slug' => 'mech-kb',
            'sku' => 'TECH-KB-01',
            'price' => 5000.00,
            'quantity' => 10,
            'summary' => 'Tactile mechanical keyboard',
        ]);

        $warehouse = Warehouse::create([
            'name' => 'Dhaka Hub',
            'code' => 'WH-DHK',
            'address' => 'Mirpur',
            'city' => 'Dhaka',
            'country' => 'Bangladesh',
            'is_active' => true,
        ]);

        $stockService = new StockReservationService();
        $stockService->addStock($warehouse->id, $product->id, 10);

        // 1. Add to Cart
        $cartResponse = $this->postJson('/api/v1/cart/add', [
            'product_id' => $product->id,
            'quantity' => 2,
        ], ['X-Session-ID' => 'session-snap-test']);

        $cartResponse->assertStatus(200);

        // 2. Process Checkout
        $checkoutResponse = $this->postJson('/api/v1/checkout/process', [
            'shipping_address' => [
                'full_name' => 'Rahim Ahmed',
                'address_line_1' => 'Dhanmondi 27',
                'city' => 'Dhaka',
                'phone' => '+8801700000000',
                'country' => 'Bangladesh',
            ],
            'payment_method' => 'cod',
        ], ['X-Session-ID' => 'session-snap-test']);

        $checkoutResponse->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $order = \App\Models\Order::with('items')->latest()->first();
        $this->assertNotNull($order);
        $this->assertCount(1, $order->items);

        $orderItem = $order->items->first();
        $this->assertEquals('Mechanical Keyboard', $orderItem->product_name);
        $this->assertEquals(5000.00, $orderItem->unit_price);
        $this->assertNotNull($orderItem->snapshot_data);
        $this->assertEquals('Tactile mechanical keyboard', $orderItem->snapshot_data['summary']);

        // 3. Mutate original product afterwards
        $product->update([
            'name' => 'REVISED KEYBOARD V2',
            'price' => 9999.00,
            'summary' => 'Updated summary text',
        ]);

        // 4. Assert that historical order item snapshot did NOT change!
        $orderItem->refresh();
        $this->assertEquals('Mechanical Keyboard', $orderItem->product_name);
        $this->assertEquals(5000.00, $orderItem->unit_price);
        $this->assertEquals('Tactile mechanical keyboard', $orderItem->snapshot_data['summary']);
    }
}

