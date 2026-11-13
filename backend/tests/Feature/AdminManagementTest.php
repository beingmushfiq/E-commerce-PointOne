<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\Category;
use App\Models\Order;
use App\Models\Slider;
use App\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin', 'guard_name' => 'web']);
        $this->admin = User::factory()->create([
            'email' => 'admin_test@centerpoint.com',
        ]);
        $this->admin->assignRole($adminRole);
    }

    public function test_admin_can_create_and_update_and_delete_product(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/products', [
            'name'        => 'Atelier Silk Scarf',
            'price'       => 145.00,
            'quantity'    => 25,
            'description' => 'Fine mulberry silk scarf.',
            'image_url'   => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.name', 'Atelier Silk Scarf');

        $productId = $response->json('data.id');

        // Update product
        $updateRes = $this->actingAs($this->admin, 'sanctum')->putJson("/api/v1/admin/products/{$productId}", [
            'price'    => 130.00,
            'quantity' => 20,
        ]);

        $updateRes->assertStatus(200)
                  ->assertJsonPath('data.price', 130);

        // Delete product
        $deleteRes = $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/v1/admin/products/{$productId}");
        $deleteRes->assertStatus(200);

        $this->assertSoftDeleted('products', ['id' => $productId]);
    }

    public function test_admin_can_create_and_update_category(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/categories', [
            'name'        => 'Haute Horology',
            'description' => 'Exclusive mechanical timepieces.',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.name', 'Haute Horology');

        $categoryId = $response->json('data.id');

        $updateRes = $this->actingAs($this->admin, 'sanctum')->putJson("/api/v1/admin/categories/{$categoryId}", [
            'name' => 'Fine Horology',
        ]);

        $updateRes->assertStatus(200)
                  ->assertJsonPath('data.name', 'Fine Horology');
    }

    public function test_admin_can_list_and_update_orders(): void
    {
        $order = Order::create([
            'order_number'    => 'CP-ORD-TEST-1',
            'status'          => 'pending',
            'payment_status'  => 'unpaid',
            'payment_method'  => 'cod',
            'subtotal'        => 200.00,
            'grand_total'     => 200.00,
            'shipping_address'=> ['city' => 'Dhaka'],
        ]);

        $listRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/v1/admin/orders');
        $listRes->assertStatus(200)
                ->assertJsonPath('status', 'success')
                ->assertJsonCount(1, 'data');

        $statusRes = $this->actingAs($this->admin, 'sanctum')->putJson("/api/v1/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $statusRes->assertStatus(200)
                  ->assertJsonPath('data.status', 'processing');
    }

    public function test_admin_can_manage_sliders_and_faqs(): void
    {
        $sliderRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/sliders', [
            'title'       => 'Grand Winter Drop',
            'subtitle'    => 'Available for limited preorder',
            'image'       => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
            'button_text' => 'Shop Winter',
            'button_link' => '/',
        ]);

        $sliderRes->assertStatus(201)
                  ->assertJsonPath('status', 'success');

        $faqRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/v1/admin/faqs', [
            'question' => 'Do you ship to Sylhet and Chittagong?',
            'answer'   => 'Yes, through Pathao and Steadfast courier delivery within 48 hours.',
        ]);

        $faqRes->assertStatus(201)
               ->assertJsonPath('status', 'success');
    }
}
