<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\StorefrontSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StorefrontCustomizerTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_config_endpoint_returns_vetted_defaults(): void
    {
        $response = $this->getJson('/api/v1/storefront/config');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.theme.default_mode', 'light')
            ->assertJsonPath('data.currency.default_currency', 'BDT')
            ->assertJsonPath('data.currency.currency_symbol', '৳')
            ->assertJsonPath('data.branding.creator_name', 'DevCenterPoint')
            ->assertJsonPath('data.branding.creator_url', 'https://devcenterpoint.com')
            ->assertJsonPath('data.motion.active_motion_style', 'editorial_flow');
    }

    public function test_mcp_login_authenticates_admin(): void
    {
        $admin = User::factory()->create([
            'email'    => 'admin@centerpoint.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/platform/auth/mcp-login', [
            'email'    => 'admin@centerpoint.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_superadmin_can_update_and_reset_settings(): void
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        // 1. Update active motion style to cinematic_showcase
        $updateResponse = $this->postJson('/api/v1/platform/customizer/settings', [
            'settings' => [
                ['key' => 'active_motion_style', 'value' => 'cinematic_showcase'],
                ['key' => 'default_currency', 'value' => 'USD'],
            ],
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertEquals('cinematic_showcase', StorefrontSetting::where('key', 'active_motion_style')->first()->value);
        $this->assertEquals('USD', StorefrontSetting::where('key', 'default_currency')->first()->value);

        // 2. Reset to defaults
        $resetResponse = $this->postJson('/api/v1/platform/customizer/reset');
        $resetResponse->assertStatus(200);

        $this->assertEquals('editorial_flow', StorefrontSetting::where('key', 'active_motion_style')->first()->value);
        $this->assertEquals('BDT', StorefrontSetting::where('key', 'default_currency')->first()->value);
    }
}
