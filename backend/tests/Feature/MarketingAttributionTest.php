<?php

namespace Tests\Feature;

use App\Domain\Marketing\Adapters\MetaCapiAdapter;
use App\Models\Category;
use App\Models\Marketing\MarketingConfig;
use App\Models\Marketing\MarketingEvent;
use App\Models\Marketing\OrderAttribution;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MarketingAttributionTest extends TestCase
{
    use RefreshDatabase;

    protected function createMarketingStaffUser(): User
    {
        $user = User::factory()->create();
        $perm = Permission::create([
            'name'         => 'manage-marketing',
            'display_name' => 'Manage Marketing',
            'group'        => 'marketing',
            'guard_name'   => 'web',
        ]);
        $role = Role::create([
            'name'         => 'marketing_manager',
            'display_name' => 'Marketing Manager',
            'guard_name'   => 'web',
        ]);
        $role->permissions()->attach($perm);
        $user->assignRole($role);

        return $user;
    }

    public function test_track_event_endpoint_persists_canonical_event_with_client_event_id(): void
    {
        $eventId = 'evt-test-' . uniqid();

        $response = $this->postJson('/api/v1/marketing/events', [
            'event_name'  => 'AddToCart',
            'event_id'    => $eventId,
            'session_id'  => 'sess-mkt-123',
            'user_data'   => [
                'email' => 'Customer@Test.com',
                'phone' => '+880 1711-000000',
            ],
            'custom_data' => [
                'currency' => 'BDT',
                'value'    => 2500.00,
                'content_ids' => ['SKU-001'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'event_id'   => $eventId,
                    'event_name' => 'AddToCart',
                ],
            ]);

        $this->assertDatabaseHas('marketing_events', [
            'event_id'     => $eventId,
            'event_name'   => 'AddToCart',
            'event_source' => 'browser',
        ]);
    }

    public function test_event_deduplication_protects_against_replay_and_double_tracking(): void
    {
        $eventId = 'evt-dedup-' . uniqid();

        // 1st dispatch
        $this->postJson('/api/v1/marketing/events', [
            'event_name' => 'ViewContent',
            'event_id'   => $eventId,
        ])->assertStatus(200);

        // 2nd dispatch (browser retry / network replay)
        $this->postJson('/api/v1/marketing/events', [
            'event_name' => 'ViewContent',
            'event_id'   => $eventId,
        ])->assertStatus(200);

        // Only 1 record should exist for this event_id
        $this->assertEquals(1, MarketingEvent::where('event_id', $eventId)->count());
    }

    public function test_meta_capi_adapter_normalizes_and_hashes_pii_with_sha256(): void
    {
        $adapter = new MetaCapiAdapter();
        $config = new MarketingConfig([
            'meta_pixel_id' => '1234567890',
            'enable_meta_capi' => true,
        ]);

        $event = new MarketingEvent([
            'event_id'   => 'evt-sha-test',
            'event_name' => 'Purchase',
            'user_data'  => [
                'email'      => '  Tanvir.Ahmed@gmail.com ',
                'phone'      => '+880 1812-345678',
                'client_ip'  => '103.25.12.1',
                'user_agent' => 'Mozilla/5.0 Chrome/120',
                'fbp'        => 'fb.1.12345678.123',
            ],
            'custom_data' => [
                'currency' => 'BDT',
                'value'    => 4500.00,
            ],
        ]);

        $formatted = $adapter->formatEvent($event, $config);

        $this->assertEquals('Purchase', $formatted['event_name']);
        $this->assertEquals('evt-sha-test', $formatted['event_id']);

        // Verify SHA-256 lowercase email hash
        $expectedEmailHash = hash('sha256', 'tanvir.ahmed@gmail.com');
        $this->assertEquals($expectedEmailHash, $formatted['user_data']['em']);

        // Verify SHA-256 numeric phone hash
        $expectedPhoneHash = hash('sha256', '8801812345678');
        $this->assertEquals($expectedPhoneHash, $formatted['user_data']['ph']);

        $this->assertEquals('103.25.12.1', $formatted['user_data']['client_ip_address']);
        $this->assertEquals('fb.1.12345678.123', $formatted['user_data']['fbp']);
    }

    public function test_google_merchant_xml_feed_generation(): void
    {
        $category = Category::create(['name' => 'Men Fashion', 'slug' => 'men-fashion']);
        Product::create([
            'category_id' => $category->id,
            'name'        => 'Handcrafted Kabli Panjabi',
            'slug'        => 'kabli-panjabi',
            'sku'         => 'PAN-KAB-01',
            'price'       => 4500.00,
            'quantity'    => 12,
            'summary'     => 'Fine blended cotton kabli panjabi set',
        ]);

        $response = $this->get('/api/v1/marketing/feeds/google-merchant.xml');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/xml', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('xmlns:g="http://base.google.com/ns/1.0"', $content);
        $this->assertStringContainsString('PAN-KAB-01', $content);
        $this->assertStringContainsString('Handcrafted Kabli Panjabi', $content);
        $this->assertStringContainsString('4500.00 BDT', $content);
        $this->assertStringContainsString('in_stock', $content);
        $this->assertStringContainsString('<g:condition>new</g:condition>', $content);
    }

    public function test_first_party_order_attribution_stats(): void
    {
        $staff = $this->createMarketingStaffUser();
        Sanctum::actingAs($staff);

        // Seed 2 orders with UTM attribution
        $order1 = Order::create([
            'order_number'     => 'ORD-MKT-01',
            'subtotal'         => 3000.00,
            'grand_total'      => 3080.00,
            'status'           => 'completed',
            'payment_status'   => 'paid',
            'payment_method'   => 'bkash',
            'shipping_address' => ['city' => 'Dhaka'],
            'billing_address'  => ['city' => 'Dhaka'],
        ]);

        OrderAttribution::create([
            'order_id'     => $order1->id,
            'utm_source'   => 'facebook',
            'utm_medium'   => 'cpc',
            'utm_campaign' => 'eid_exclusive',
            'fbclid'       => 'IwAR123FakeFbClid',
        ]);

        $order2 = Order::create([
            'order_number'     => 'ORD-MKT-02',
            'subtotal'         => 2000.00,
            'grand_total'      => 2080.00,
            'status'           => 'completed',
            'payment_status'   => 'paid',
            'payment_method'   => 'bkash',
            'shipping_address' => ['city' => 'Dhaka'],
            'billing_address'  => ['city' => 'Dhaka'],
        ]);

        OrderAttribution::create([
            'order_id'     => $order2->id,
            'utm_source'   => 'facebook',
            'utm_medium'   => 'cpc',
            'utm_campaign' => 'eid_exclusive',
            'fbclid'       => 'IwAR456FakeFbClid',
        ]);

        $response = $this->getJson('/api/v1/marketing/attribution/stats');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $stats = $response->json('data');
        $this->assertNotEmpty($stats);
        $this->assertEquals('facebook', $stats[0]['utm_source']);
        $this->assertEquals('eid_exclusive', $stats[0]['utm_campaign']);
        $this->assertEquals(2, $stats[0]['orders_count']);
        $this->assertEquals(5160.00, (float) $stats[0]['total_revenue']);
    }

    public function test_marketing_config_encrypted_storage(): void
    {
        $staff = $this->createMarketingStaffUser();
        Sanctum::actingAs($staff);

        $secretToken = 'EAAK_MetaLongLivedSecretToken_XYZ12345';

        $response = $this->putJson('/api/v1/marketing/config', [
            'meta_pixel_id'    => '9876543210',
            'meta_capi_token'  => $secretToken,
            'enable_meta_capi' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Check raw database table
        $rawConfig = DB::table('marketing_configs')->where('id', 1)->first();
        $this->assertNotNull($rawConfig);
        $this->assertNotEquals($secretToken, $rawConfig->encrypted_meta_capi_token);
    }
}

