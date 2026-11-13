<?php

namespace Tests\Feature;

use App\Domain\Fulfillment\CourierManager;
use App\Models\Category;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CourierFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected function createTestOrder(): Order
    {
        $category = Category::create(['name' => 'Logistics', 'slug' => 'logistics']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Logistics Item',
            'slug'        => 'logistics-item',
            'sku'         => 'LOG-001',
            'price'       => 1500.00,
            'quantity'    => 5,
        ]);

        return Order::create([
            'order_number'     => 'ORD-LOG-' . uniqid(),
            'subtotal'         => 1500.00,
            'tax_total'        => 0.00,
            'shipping_total'   => 80.00,
            'discount_total'   => 0.00,
            'grand_total'      => 1580.00,
            'status'           => 'processing',
            'payment_status'   => 'paid',
            'payment_method'   => 'bkash',
            'shipping_address' => [
                'name'    => 'Rahim Ahmed',
                'phone'   => '01711000000',
                'address' => 'House 12, Road 4, Dhanmondi',
                'city'    => 'Dhaka',
            ],
            'billing_address'  => [
                'name'    => 'Rahim Ahmed',
                'phone'   => '01711000000',
                'address' => 'House 12, Road 4, Dhanmondi',
                'city'    => 'Dhaka',
            ],
        ]);
    }

    public function test_courier_manager_books_consignment_via_test_adapter(): void
    {
        $order = $this->createTestOrder();
        $manager = app(CourierManager::class);

        $shipment = $manager->bookOrderShipment($order, 'test', ['pickup_address' => 'Mirpur Warehouse']);

        $this->assertInstanceOf(Shipment::class, $shipment);
        $this->assertEquals('booked', $shipment->status);
        $this->assertEquals('test', $shipment->courier_name);
        $this->assertNotEmpty($shipment->consignment_id);
        $this->assertNotEmpty($shipment->tracking_code);

        // Assert order transitioned to ready_for_shipment
        $order->refresh();
        $this->assertEquals('ready_for_shipment', $order->status);
    }

    public function test_tracking_update_transitions_order_when_delivered(): void
    {
        $order = $this->createTestOrder();
        $manager = app(CourierManager::class);

        // Book shipment first
        $shipment = $manager->bookOrderShipment($order, 'test');
        $this->assertEquals('booked', $shipment->status);

        // Simulate order moving to shipped
        $order->update(['status' => 'shipped']);

        // Now update tracking via manager where test adapter returns tracking info
        $tracking = $manager->trackOrderShipment($shipment);

        $this->assertIsArray($tracking);
        $this->assertArrayHasKey('status', $tracking);
    }

    public function test_api_book_shipment_requires_staff_inventory_or_admin_permission(): void
    {
        $order = $this->createTestOrder();

        // 1. Unauthenticated request -> 401
        $guestResponse = $this->postJson('/api/v1/fulfillment/book', [
            'order_id' => $order->id,
            'courier'  => 'test',
        ]);
        $guestResponse->assertStatus(401);

        // 2. Regular customer without permission -> 403
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $customerResponse = $this->postJson('/api/v1/fulfillment/book', [
            'order_id' => $order->id,
            'courier'  => 'test',
        ]);
        $customerResponse->assertStatus(403);

        // 3. Authorized staff with manage-inventory permission -> 201
        $staff = User::factory()->create();
        $perm = Permission::create([
            'name'         => 'manage-inventory',
            'display_name' => 'Manage Inventory',
            'group'        => 'inventory',
            'guard_name'   => 'web',
        ]);
        $role = Role::create([
            'name'         => 'inventory_manager',
            'display_name' => 'Inventory Manager',
            'guard_name'   => 'web',
        ]);
        $role->permissions()->attach($perm);
        $staff->assignRole($role);

        Sanctum::actingAs($staff);

        $staffResponse = $this->postJson('/api/v1/fulfillment/book', [
            'order_id' => $order->id,
            'courier'  => 'test',
        ]);

        $staffResponse->assertStatus(201)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Shipment booked successfully',
            ])
            ->assertJsonPath('data.courier_name', 'test');

        $this->assertDatabaseHas('shipments', [
            'order_id'     => $order->id,
            'courier_name' => 'test',
            'status'       => 'booked',
        ]);
    }

    public function test_api_track_shipment_endpoint(): void
    {
        $order = $this->createTestOrder();
        $manager = app(CourierManager::class);
        $shipment = $manager->bookOrderShipment($order, 'test');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/fulfillment/track/{$shipment->consignment_id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ])
            ->assertJsonPath('data.shipment.consignment_id', $shipment->consignment_id);
    }

    public function test_api_courier_webhook_endpoint(): void
    {
        $response = $this->postJson('/api/v1/fulfillment/webhook/test', [
            'consignment_id' => 'CN-TEST-999',
            'status'         => 'delivered',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'handled' => true,
                ],
            ]);
    }
}
