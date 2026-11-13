<?php

namespace Tests\Feature;

use App\Domain\Payments\Exceptions\InvalidPaymentMethodException;
use App\Domain\Payments\PaymentGatewayManager;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentIdempotencyKey;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected function createTestOrder(float $amount = 2500.00): Order
    {
        $category = Category::create(['name' => 'General', 'slug' => 'general']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Test Gadget',
            'slug'        => 'test-gadget',
            'sku'         => 'TEST-001',
            'price'       => $amount,
            'quantity'    => 5,
        ]);

        return Order::create([
            'order_number'     => 'ORD-PAY-' . uniqid(),
            'subtotal'         => $amount,
            'tax_total'        => 0.00,
            'shipping_total'   => 0.00,
            'discount_total'   => 0.00,
            'grand_total'      => $amount,
            'status'           => 'pending',
            'payment_status'   => 'unpaid',
            'payment_method'   => 'test',
            'shipping_address' => ['city' => 'Dhaka', 'address' => 'Banani'],
            'billing_address'  => ['city' => 'Dhaka', 'address' => 'Banani'],
        ]);
    }

    public function test_unknown_payment_method_throws_invalid_payment_method_exception_sec_02(): void
    {
        $order = $this->createTestOrder();
        $manager = app(PaymentGatewayManager::class);

        $this->expectException(InvalidPaymentMethodException::class);
        $this->expectExceptionMessage('Payment method [cryptocurrency] is not supported or active.');

        // Must reject unknown payment methods instead of silently creating an unverified transaction
        $manager->processPayment($order, 'cryptocurrency');
    }

    public function test_payment_gateway_manager_processes_test_adapter_payment(): void
    {
        $order = $this->createTestOrder(1200.00);
        $manager = app(PaymentGatewayManager::class);

        $payment = $manager->processPayment($order, 'test');

        $this->assertInstanceOf(Payment::class, $payment);
        $this->assertEquals('completed', $payment->status);
        $this->assertEquals('test', $payment->payment_method);
        $this->assertEquals(1200.00, (float) $payment->amount);

        // Verify order status updated to processing and paid
        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('processing', $order->status);
    }

    public function test_cod_payment_adapter_marks_payment_pending(): void
    {
        $order = $this->createTestOrder(800.00);
        $manager = app(PaymentGatewayManager::class);

        $payment = $manager->processPayment($order, 'cod');

        $this->assertInstanceOf(Payment::class, $payment);
        $this->assertEquals('pending', $payment->status);
        $this->assertEquals('cod', $payment->payment_method);

        // COD remains unpaid until delivery
        $order->refresh();
        $this->assertEquals('unpaid', $order->payment_status);
    }

    public function test_payment_verification_is_idempotent_with_ledger_record(): void
    {
        $order = $this->createTestOrder(3500.00);
        $manager = app(PaymentGatewayManager::class);

        $txnId = 'TXN_IDEM_' . uniqid();

        // 1st verification call
        $payment1 = $manager->verifyPayment($order, 'test', $txnId, ['verified' => true]);
        $this->assertEquals('completed', $payment1->status);

        // Assert idempotency record exists
        $this->assertDatabaseHas('payment_idempotency_keys', [
            'idempotency_key' => "test:{$txnId}",
            'provider'        => 'test',
            'order_id'        => $order->id,
            'status'          => 'completed',
        ]);

        // 2nd verification call with same txnId (replay attempt)
        $payment2 = $manager->verifyPayment($order, 'test', $txnId, ['verified' => true]);
        $this->assertEquals($payment1->id, $payment2->id);

        // Ensure no duplicate payment rows were created
        $paymentCount = Payment::where('order_id', $order->id)
            ->where('transaction_id', $txnId)
            ->count();
        $this->assertEquals(1, $paymentCount);
    }

    public function test_api_verify_payment_endpoint(): void
    {
        $order = $this->createTestOrder(1500.00);
        $txnId = 'TXN_API_' . uniqid();

        $response = $this->postJson('/api/v1/payments/verify', [
            'order_id'       => $order->id,
            'gateway'        => 'test',
            'transaction_id' => $txnId,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'order_status'   => 'processing',
                    'payment_status' => 'paid',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'order_id'       => $order->id,
            'transaction_id' => $txnId,
            'status'         => 'completed',
        ]);
    }

    public function test_api_payment_webhook_endpoint(): void
    {
        $response = $this->postJson('/api/v1/payments/webhook/test', [
            'transaction_id' => 'TXN_WH_001',
            'status'         => 'success',
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
