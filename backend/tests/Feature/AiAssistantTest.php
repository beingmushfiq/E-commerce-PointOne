<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AiAssistantTest extends TestCase
{
    use RefreshDatabase;

    protected function createStaffUser(): User
    {
        $user = User::factory()->create();
        $perm = Permission::create([
            'name'         => 'access-admin',
            'display_name' => 'Access Admin',
            'group'        => 'admin',
            'guard_name'   => 'web',
        ]);
        $role = Role::create([
            'name'         => 'store_manager',
            'display_name' => 'Store Manager',
            'guard_name'   => 'web',
        ]);
        $role->permissions()->attach($perm);
        $user->assignRole($role);

        return $user;
    }

    public function test_shopping_assistant_handles_greeting_bilingual(): void
    {
        // 1. English Greeting
        $enResponse = $this->postJson('/api/v1/ai/chat', [
            'message'    => 'Hello, good morning!',
            'session_id' => 'sess-ai-en-1',
        ]);

        $enResponse->assertStatus(200)
            ->assertJsonPath('data.intent', 'greeting')
            ->assertJsonPath('data.structured_payload.quick_actions.0.label', 'New Arrivals');
        $this->assertStringContainsStringIgnoringCase('welcome to Centerpoint', $enResponse->json('data.reply'));

        // 2. Bangla Greeting
        $bnResponse = $this->postJson('/api/v1/ai/chat', [
            'message'    => 'Assalamu Alaikum, kemon achen?',
            'session_id' => 'sess-ai-bn-1',
        ]);

        $bnResponse->assertStatus(200)
            ->assertJsonPath('data.intent', 'greeting');
        $this->assertStringContainsString('আসসালামু আলাইকুম', $bnResponse->json('data.reply'));
    }

    public function test_shopping_assistant_finds_products_and_returns_structured_cards(): void
    {
        $category = Category::create(['name' => 'Traditional', 'slug' => 'traditional']);
        Product::create([
            'category_id' => $category->id,
            'name'        => 'Dhakai Jamdani Silk Saree',
            'slug'        => 'dhakai-jamdani-saree',
            'sku'         => 'SAR-001',
            'price'       => 18500.00,
            'quantity'    => 5,
            'summary'     => 'Authentic handwoven Dhakai Jamdani',
        ]);

        Product::create([
            'category_id' => $category->id,
            'name'        => 'Royal Embroidered Silk Panjabi',
            'slug'        => 'royal-panjabi',
            'sku'         => 'PAN-001',
            'price'       => 6500.00,
            'quantity'    => 8,
            'summary'     => 'Silk panjabi with zardozi collar embroidery',
        ]);

        $response = $this->postJson('/api/v1/ai/chat', [
            'message'    => 'Jamdani Saree collection dekhaw',
            'session_id' => 'sess-ai-search',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.intent', 'find_product')
            ->assertJsonPath('data.structured_payload.type', 'product_grid');

        $products = $response->json('data.structured_payload.products');
        $this->assertNotEmpty($products);
        $this->assertEquals('Dhakai Jamdani Silk Saree', $products[0]['name']);
        $this->assertEquals(18500.00, $products[0]['price']);
    }

    public function test_shopping_assistant_tracks_order_live(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-LIVE-777',
            'subtotal'         => 3500.00,
            'grand_total'      => 3580.00,
            'status'           => 'shipped',
            'payment_status'   => 'paid',
            'payment_method'   => 'bkash',
            'shipping_address' => ['city' => 'Dhaka'],
            'billing_address'  => ['city' => 'Dhaka'],
        ]);

        Shipment::create([
            'order_id'         => $order->id,
            'courier_name'     => 'steadfast',
            'consignment_id'   => 'CN-SF-9988',
            'tracking_code'    => 'TRK-SF-9988',
            'status'           => 'in_transit',
            'delivery_address' => ['city' => 'Dhaka'],
        ]);

        $response = $this->postJson('/api/v1/ai/chat', [
            'message'    => 'Where is my order ORD-LIVE-777?',
            'session_id' => 'sess-ai-track',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.intent', 'track_order')
            ->assertJsonPath('data.structured_payload.type', 'order_card')
            ->assertJsonPath('data.structured_payload.details.order_number', 'ORD-LIVE-777')
            ->assertJsonPath('data.structured_payload.details.courier', 'steadfast')
            ->assertJsonPath('data.structured_payload.details.tracking_code', 'TRK-SF-9988');
    }

    public function test_shopping_assistant_explains_store_policies(): void
    {
        $response = $this->postJson('/api/v1/ai/chat', [
            'message'    => 'What is your return and exchange policy?',
            'session_id' => 'sess-ai-policy',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.intent', 'check_policy')
            ->assertJsonPath('data.structured_payload.type', 'policy_card')
            ->assertJsonPath('data.structured_payload.details.timeline', '7 Days');

        $this->assertStringContainsString('7-day exchange and return policy', $response->json('data.reply'));
    }

    public function test_staff_business_assistant_generates_real_operational_insights(): void
    {
        $staff = $this->createStaffUser();
        Sanctum::actingAs($staff);

        // Seed an order today
        Order::create([
            'order_number'     => 'ORD-BI-101',
            'subtotal'         => 4200.00,
            'grand_total'      => 4200.00,
            'status'           => 'processing',
            'payment_status'   => 'paid',
            'payment_method'   => 'sslcommerz',
            'shipping_address' => ['city' => 'Dhaka'],
            'billing_address'  => ['city' => 'Dhaka'],
        ]);

        $response = $this->postJson('/api/v1/ai/business-query', [
            'query' => 'Show me today sales and revenue',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.intent', 'revenue_summary')
            ->assertJsonPath('data.structured_payload.type', 'business_kpi')
            ->assertJsonPath('data.structured_payload.summary.today_orders', 1);

        $this->assertStringContainsString('4,200.00', $response->json('data.reply'));
    }

    public function test_ai_configuration_is_encrypted_at_rest(): void
    {
        $staff = $this->createStaffUser();
        Sanctum::actingAs($staff);

        $secretKey = 'AIzaSySecretSampleKey12345';

        $response = $this->putJson('/api/v1/ai/config', [
            'provider' => 'gemini',
            'api_key'  => $secretKey,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.provider', 'gemini')
            ->assertJsonPath('data.has_api_key', true);

        // Verify key is encrypted in raw database row, never stored as plain text
        $rawConfig = DB::table('ai_configs')->where('id', 1)->first();
        $this->assertNotNull($rawConfig);
        $this->assertNotEquals($secretKey, $rawConfig->encrypted_api_key);
    }
}
