<?php

namespace Tests\Feature\Api;

use App\Models\Coupon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_apply_fixed_and_percentage_coupons(): void
    {
        Coupon::create([
            'code' => 'SAVE50',
            'type' => 'fixed',
            'value' => 50.00,
            'min_order_amount' => 100.00,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/marketing/apply-coupon', [
            'code' => 'SAVE50',
            'subtotal' => 200.00,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.discount_amount', 50);
    }

    public function test_cannot_apply_expired_coupon(): void
    {
        Coupon::create([
            'code' => 'EXPIRED10',
            'type' => 'percentage',
            'value' => 10,
            'expires_at' => now()->subDay(),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/marketing/apply-coupon', [
            'code' => 'EXPIRED10',
            'subtotal' => 100.00,
        ]);

        $response->assertStatus(422);
    }

    public function test_can_subscribe_to_newsletter(): void
    {
        $response = $this->postJson('/api/v1/marketing/subscribe', [
            'email' => 'user@example.com',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('subscribers', ['email' => 'user@example.com']);
    }
}
