<?php

namespace Tests\Unit;

use App\Exceptions\InvalidOrderTransitionException;
use App\Models\Order;
use App\Models\OrderStateTransition;
use App\Services\OrderStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_transition_through_valid_lifecycle(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-TEST-001',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 100.00,
            'grand_total' => 150.00,
            'shipping_address' => ['city' => 'Dhaka'],
        ]);

        $stateMachine = new OrderStateMachine();

        // pending -> confirmed
        $order = $stateMachine->transition($order, 'confirmed', 'staff', reason: 'Payment confirmed');
        $this->assertEquals('confirmed', $order->status);

        // confirmed -> processing
        $order = $stateMachine->transition($order, 'processing', 'staff');
        $this->assertEquals('processing', $order->status);

        // processing -> shipped
        $order = $stateMachine->transition($order, 'shipped', 'courier');
        $this->assertEquals('shipped', $order->status);

        // shipped -> delivered
        $order = $stateMachine->transition($order, 'delivered', 'courier');
        $this->assertEquals('delivered', $order->status);

        // Check transition audit records count
        $this->assertEquals(4, OrderStateTransition::where('order_id', $order->id)->count());
    }

    public function test_throws_exception_on_invalid_transition(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-TEST-002',
            'status' => 'delivered',
            'payment_status' => 'paid',
            'subtotal' => 200.00,
            'grand_total' => 250.00,
            'shipping_address' => ['city' => 'Chittagong'],
        ]);

        $stateMachine = new OrderStateMachine();

        $this->expectException(InvalidOrderTransitionException::class);
        // Invalid: delivered cannot transition back to processing!
        $stateMachine->transition($order, 'processing');
    }
}
