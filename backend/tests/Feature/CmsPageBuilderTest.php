<?php

namespace Tests\Feature;

use App\Domain\Cms\Services\PageBuilderService;
use App\Models\Cms\StorefrontEmbed;
use App\Models\Cms\ThemeConfig;
use App\Models\Page;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CmsPageBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected function createCmsStaffUser(): User
    {
        $user = User::factory()->create();
        $perm = Permission::create([
            'name'         => 'manage-cms',
            'display_name' => 'Manage CMS',
            'group'        => 'cms',
            'guard_name'   => 'web',
        ]);
        $role = Role::create([
            'name'         => 'cms_editor',
            'display_name' => 'CMS Editor',
            'guard_name'   => 'web',
        ]);
        $role->permissions()->attach($perm);
        $user->assignRole($role);

        return $user;
    }

    public function test_public_page_sections_endpoint_returns_structured_schema(): void
    {
        $page = Page::create([
            'title'        => 'Spring Campaign 2026',
            'slug'         => 'spring-2026',
            'is_published' => true,
            'sections'     => [
                [
                    'id'       => 'sec-hero-1',
                    'type'     => 'hero',
                    'settings' => ['full_width' => true],
                    'content'  => [
                        'headline' => 'Elevate Your Wardrobe',
                        'subhead'  => 'Spring collection now live',
                        'cta_text' => 'Shop Now',
                        'cta_url'  => '/category/spring',
                    ],
                ],
                [
                    'id'       => 'sec-feat-1',
                    'type'     => 'featured_products',
                    'settings' => ['columns' => 4, 'limit' => 8],
                    'content'  => ['collection_slug' => 'spring-essentials'],
                ],
            ],
            'custom_css'   => '.hero-custom { letter-spacing: 0.1em; }',
            'version'      => 1,
        ]);

        $response = $this->getJson('/api/v1/cms/pages/spring-2026/sections');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data'   => [
                    'title'   => 'Spring Campaign 2026',
                    'slug'    => 'spring-2026',
                    'version' => 1,
                ],
            ])
            ->assertJsonCount(2, 'data.sections')
            ->assertJsonPath('data.sections.0.type', 'hero');
    }

    public function test_theme_endpoint_returns_design_tokens_and_computed_css_vars(): void
    {
        ThemeConfig::create([
            'name'      => 'Custom Luxury Theme',
            'is_active' => true,
            'tokens'    => [
                'colors' => [
                    'primary' => '#0f172a',
                    'accent'  => '#f59e0b',
                ],
            ],
            'custom_css' => '.brand-badge { font-weight: 700; }',
        ]);

        $response = $this->getJson('/api/v1/cms/theme');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Custom Luxury Theme');

        $css = $response->json('data.css_rules');
        $this->assertStringContainsString('--cp-color-primary: #0f172a', $css);
        $this->assertStringContainsString('--cp-color-accent: #f59e0b', $css);
        $this->assertStringContainsString('.brand-badge { font-weight: 700; }', $css);
    }

    public function test_sec_04_sandboxed_embed_renders_with_strict_content_security_policy(): void
    {
        $embed = StorefrontEmbed::create([
            'name'          => 'Interactive Sizing Calculator',
            'sandbox_token' => 'token-test-calc-12345',
            'html_code'     => '<div class="sizing-widget"><h2>Size Guide</h2></div>',
            'css_code'      => '.sizing-widget { background: #000; color: #fff; }',
            'js_code'       => 'console.log("Isolated widget loaded");',
            'is_sandboxed'  => true,
            'is_published'  => true,
        ]);

        $response = $this->get("/api/v1/cms/embeds/{$embed->sandbox_token}/render");

        // 1. Must return 200 with HTML
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');

        // 2. SEC-04 Verification: Must enforce strict CSP boundary
        $this->assertTrue($response->headers->has('Content-Security-Policy'));
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("default-src 'none'", $csp);
        $this->assertStringContainsString("script-src 'unsafe-inline' https:", $csp);

        // 3. Verify HTML contents are rendered inside body
        $content = $response->getContent();
        $this->assertStringContainsString('Size Guide', $content);
        $this->assertStringContainsString('background: #000', $content);
        $this->assertStringContainsString('Isolated widget loaded', $content);
    }

    public function test_page_builder_draft_publish_and_version_rollback(): void
    {
        $service = app(PageBuilderService::class);

        $page = Page::create([
            'title'        => 'Black Friday Mega Sale',
            'slug'         => 'black-friday',
            'is_published' => false,
            'version'      => 1,
        ]);

        // 1. Save Draft with initial sections
        $service->saveDraft(
            page: $page,
            sections: [
                ['id' => 'sec-1', 'type' => 'hero', 'content' => ['headline' => 'BF 50% Off']],
            ],
            customCss: '/* v1 styles */'
        );

        $page->refresh();
        $this->assertCount(1, $page->sections);

        // 2. Publish Version 1
        $version1 = $service->publishPage($page, 'Initial launch');
        $this->assertEquals(1, $version1->version_number);

        $page->refresh();
        $this->assertEquals(2, $page->version); // Next version counter incremented
        $this->assertTrue($page->is_published);

        // 3. Update Draft with new sections for Version 2
        $service->saveDraft(
            page: $page,
            sections: [
                ['id' => 'sec-1', 'type' => 'hero', 'content' => ['headline' => 'BF 70% Final Clearance']],
                ['id' => 'sec-2', 'type' => 'faq', 'content' => ['title' => 'Sale FAQs']],
            ],
            customCss: '/* v2 styles */'
        );

        $version2 = $service->publishPage($page, 'Clearance update');
        $this->assertEquals(2, $version2->version_number);

        $page->refresh();
        $this->assertCount(2, $page->sections);

        // 4. Rollback to Version 1
        $rolledBackPage = $service->rollbackToVersion($page, 1);
        $this->assertCount(1, $rolledBackPage->sections);
        $this->assertEquals('BF 50% Off', $rolledBackPage->sections[0]['content']['headline']);
        $this->assertEquals('/* v1 styles */', $rolledBackPage->custom_css);
    }

    public function test_privileged_cms_endpoints_rbac(): void
    {
        // 1. Unauthenticated -> 401
        $guestResponse = $this->getJson('/api/v1/cms/admin/pages');
        $guestResponse->assertStatus(401);

        // 2. Regular customer without manage-cms -> 403
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $customerResponse = $this->getJson('/api/v1/cms/admin/pages');
        $customerResponse->assertStatus(403);

        // 3. Authorized CMS editor -> 200
        $editor = $this->createCmsStaffUser();
        Sanctum::actingAs($editor);

        $listResponse = $this->getJson('/api/v1/cms/admin/pages');
        $listResponse->assertStatus(200);

        // Create page via API
        $createResponse = $this->postJson('/api/v1/cms/admin/pages', [
            'title'        => 'About Atelier',
            'slug'         => 'about-atelier',
            'content'      => 'Heritage of luxury craftmanship',
            'is_published' => true,
        ]);
        $createResponse->assertStatus(201);
        $pageId = $createResponse->json('data.id');

        // Update draft sections
        $draftResponse = $this->putJson("/api/v1/cms/admin/pages/{$pageId}", [
            'sections' => [
                ['id' => 'about-hero', 'type' => 'hero', 'content' => ['headline' => 'The Atelier Story']],
            ],
        ]);
        $draftResponse->assertStatus(200);

        // Publish page via API
        $publishResponse = $this->postJson("/api/v1/cms/admin/pages/{$pageId}/publish", [
            'notes' => 'First release',
        ]);
        $publishResponse->assertStatus(200)
            ->assertJsonPath('data.version.version_number', 1);

        // Create sandboxed embed via API
        $embedResponse = $this->postJson('/api/v1/cms/admin/embeds', [
            'name'      => 'Lookbook Carousel',
            'html_code' => '<div class="lookbook">Spring 2026</div>',
        ]);
        $embedResponse->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertNotEmpty($embedResponse->json('data.sandbox_token'));
    }
}

