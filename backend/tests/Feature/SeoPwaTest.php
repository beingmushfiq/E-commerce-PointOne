<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoPwaTest extends TestCase
{
    use RefreshDatabase;

    public function test_xml_sitemap_renders_valid_xml_with_all_entities(): void
    {
        $category = Category::create([
            'name'        => 'Luxury Watches',
            'slug'        => 'luxury-watches',
            'description' => 'Fine timepieces',
            'is_active'   => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Royal Chronograph',
            'slug'        => 'royal-chronograph',
            'sku'         => 'ROYAL-001',
            'price'       => 250000.00,
            'quantity'    => 5,
            'summary'     => 'Automatic luxury chronograph',
            'is_active'   => true,
        ]);

        $page = Page::create([
            'title'        => 'About Centerpoint',
            'slug'         => 'about-us',
            'content'      => '<p>Heritage and luxury commerce.</p>',
            'is_published' => true,
        ]);

        $author = \App\Models\User::factory()->create();

        $blog = BlogPost::create([
            'author_id'    => $author->id,
            'title'        => 'The Horology Guide 2026',
            'slug'         => 'horology-guide-2026',
            'content'      => '<p>Comprehensive horology insights.</p>',
            'is_published' => true,
        ]);

        // 1. Web route
        $webResponse = $this->get('/sitemap.xml');
        $webResponse->assertStatus(200);
        $this->assertStringContainsString('application/xml', $webResponse->headers->get('Content-Type'));
        $webXml = $webResponse->getContent();

        $this->assertStringContainsString('<urlset', $webXml);
        $this->assertStringContainsString('/categories/luxury-watches', $webXml);
        $this->assertStringContainsString('/products/royal-chronograph', $webXml);
        $this->assertStringContainsString('/pages/about-us', $webXml);
        $this->assertStringContainsString('/blog/horology-guide-2026', $webXml);

        // 2. API route
        $apiResponse = $this->getJson('/api/v1/seo/sitemap.xml');
        $apiResponse->assertStatus(200);
        $this->assertStringContainsString('<urlset', $apiResponse->getContent());
    }

    public function test_robots_txt_disallows_privileged_paths_and_references_sitemap(): void
    {
        $response = $this->get('/robots.txt');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/plain', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Disallow: /admin/', $content);
        $this->assertStringContainsString('Disallow: /cart', $content);
        $this->assertStringContainsString('Disallow: /checkout', $content);
        $this->assertStringContainsString('Sitemap:', $content);
        $this->assertStringContainsString('/sitemap.xml', $content);
    }

    public function test_product_json_ld_and_meta_tags_endpoint(): void
    {
        $brand = Brand::create([
            'name' => 'Audemars',
            'slug' => 'audemars',
        ]);

        $category = Category::create([
            'name' => 'Watches',
            'slug' => 'watches',
        ]);

        $product = Product::create([
            'brand_id'    => $brand->id,
            'category_id' => $category->id,
            'name'        => 'Royal Oak Offshore',
            'slug'        => 'royal-oak-offshore',
            'sku'         => 'AP-ROO-01',
            'price'       => 4500000.00,
            'quantity'    => 2,
            'summary'     => 'Iconic stainless steel luxury sports watch.',
            'image_url'   => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
            'is_active'   => true,
        ]);

        $response = $this->getJson("/api/v1/seo/product/{$product->slug}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.json_ld.@context', 'https://schema.org')
            ->assertJsonPath('data.json_ld.@type', 'Product')
            ->assertJsonPath('data.json_ld.name', 'Royal Oak Offshore')
            ->assertJsonPath('data.json_ld.sku', 'AP-ROO-01')
            ->assertJsonPath('data.json_ld.brand.name', 'Audemars')
            ->assertJsonPath('data.json_ld.offers.priceCurrency', 'BDT')
            ->assertJsonPath('data.json_ld.offers.price', '4500000.00')
            ->assertJsonPath('data.json_ld.offers.availability', 'https://schema.org/InStock')
            ->assertJsonPath('data.open_graph.og:type', 'product')
            ->assertJsonPath('data.open_graph.product:price:amount', '4500000.00')
            ->assertJsonPath('data.twitter_card.twitter:card', 'summary_large_image');
    }

    public function test_breadcrumb_json_ld_generation(): void
    {
        $crumbs = [
            ['name' => 'Home', 'url' => 'https://centerpoint.test/'],
            ['name' => 'Watches', 'url' => 'https://centerpoint.test/categories/watches'],
            ['name' => 'Chronographs', 'url' => 'https://centerpoint.test/categories/chronographs'],
        ];

        $response = $this->postJson('/api/v1/seo/breadcrumbs', [
            'crumbs' => $crumbs,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.@context', 'https://schema.org')
            ->assertJsonPath('data.@type', 'BreadcrumbList')
            ->assertJsonCount(3, 'data.itemListElement')
            ->assertJsonPath('data.itemListElement.0.name', 'Home')
            ->assertJsonPath('data.itemListElement.0.position', 1)
            ->assertJsonPath('data.itemListElement.2.name', 'Chronographs')
            ->assertJsonPath('data.itemListElement.2.position', 3);
    }

    public function test_pwa_manifest_and_service_worker_files_exist_and_are_valid(): void
    {
        $manifestPath = base_path('../frontend/public/manifest.json');
        $this->assertFileExists($manifestPath);

        $manifestContent = file_get_contents($manifestPath);
        $manifestJson = json_decode($manifestContent, true);

        $this->assertIsArray($manifestJson);
        $this->assertEquals('CENTERPOINT — Flagship Commerce', $manifestJson['name']);
        $this->assertEquals('CENTERPOINT', $manifestJson['short_name']);
        $this->assertEquals('standalone', $manifestJson['display']);
        $this->assertNotEmpty($manifestJson['icons']);

        $swPath = base_path('../frontend/public/sw.js');
        $this->assertFileExists($swPath);

        $swContent = file_get_contents($swPath);
        $this->assertStringContainsString("CACHE_NAME = 'centerpoint-pwa-v1'", $swContent);
        $this->assertStringContainsString("self.addEventListener('install'", $swContent);
        $this->assertStringContainsString("self.addEventListener('fetch'", $swContent);
    }
}
