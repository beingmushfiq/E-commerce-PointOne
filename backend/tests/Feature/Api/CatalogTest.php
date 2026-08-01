<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_categories(): void
    {
        Category::create([
            'name' => 'Electronics',
            'slug' => 'electronics',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'data' => [['id', 'name', 'slug']]]);
    }

    public function test_can_fetch_products_list(): void
    {
        $category = Category::create([
            'name' => 'Smartphones',
            'slug' => 'smartphones',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Flagship Phone',
            'slug' => 'flagship-phone',
            'sku' => 'PHONE-001',
            'price' => 999.99,
            'quantity' => 10,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'data' => [['id', 'name', 'slug', 'price']], 'meta']);
    }

    public function test_can_fetch_single_product_by_slug(): void
    {
        $category = Category::create([
            'name' => 'Laptops',
            'slug' => 'laptops',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Pro Laptop',
            'slug' => 'pro-laptop',
            'sku' => 'LAP-001',
            'price' => 1999.99,
            'quantity' => 5,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/products/' . $product->slug);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'name' => 'Pro Laptop',
                    'slug' => 'pro-laptop',
                    'price' => 1999.99,
                ]
            ]);
    }
}
