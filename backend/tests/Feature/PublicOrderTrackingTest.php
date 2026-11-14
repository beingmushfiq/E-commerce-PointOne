<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicOrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_publicly_track_existing_order_by_order_number(): void
    {
        $order = Order::create([
            'order_number'    => 'ORD-TESTTRACK123',
            'status'          => 'pending',
            'payment_status'  => 'paid',
            'payment_method'  => 'bkash',
            'subtotal'        => 50000.00,
            'grand_total'     => 50050.00,
            'shipping_address'=> [
                'full_name' => 'Fahim Rahman',
                'phone'     => '+8801712345678',
                'city'      => 'Dhaka',
                'district'  => 'Dhaka',
            ],
        ]);

        $response = $this->getJson('/api/v1/orders/public-track/ORD-TESTTRACK123');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.order_number', 'ORD-TESTTRACK123')
            ->assertJsonPath('data.recipient', 'Fahim Rahman')
            ->assertJsonPath('data.payment_method', 'bkash');
    }

    public function test_returns_404_for_nonexistent_reference(): void
    {
        $response = $this->getJson('/api/v1/orders/public-track/NONEXISTENT-999');

        $response->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    public function test_can_track_order_via_shipment_consignment_id(): void
    {
        $order = Order::create([
            'order_number'    => 'ORD-SHIPMENT456',
            'status'          => 'shipped',
            'payment_status'  => 'paid',
            'payment_method'  => 'sslcommerz',
            'subtotal'        => 85000.00,
            'grand_total'     => 85050.00,
            'shipping_address'=> [
                'full_name' => 'Tanvir Ahmed',
                'city'      => 'Chittagong',
            ],
        ]);

        Shipment::create([
            'order_id'       => $order->id,
            'courier_name'   => 'steadfast',
            'consignment_id' => 'STF-TRACK987',
            'tracking_code'  => 'STF-TRACK987',
            'status'         => 'in_transit',
            'delivery_address' => ['city' => 'Chittagong', 'phone' => '+8801700000000'],
        ]);

        $response = $this->getJson('/api/v1/orders/public-track/STF-TRACK987');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.order_number', 'ORD-SHIPMENT456')
            ->assertJsonPath('data.courier', 'Steadfast');
    }
}
