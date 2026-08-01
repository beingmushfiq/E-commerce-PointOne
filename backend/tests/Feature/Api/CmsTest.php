<?php

namespace Tests\Feature\Api;

use App\Models\Page;
use App\Models\Slider;
use App\Models\Menu;
use App\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CmsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_sliders(): void
    {
        Slider::create([
            'title' => 'Summer Sale',
            'image' => '/sliders/summer.jpg',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/cms/sliders');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'data' => [['id', 'title', 'image']]]);
    }

    public function test_can_fetch_menus(): void
    {
        Menu::create([
            'title' => 'Home',
            'url' => '/',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/cms/menus');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'data' => [['id', 'title', 'url']]]);
    }

    public function test_can_fetch_page_by_slug(): void
    {
        Page::create([
            'title' => 'About Us',
            'slug' => 'about-us',
            'content' => 'Company history and mission.',
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/cms/pages/about-us');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'title' => 'About Us',
                    'slug' => 'about-us',
                ]
            ]);
    }
}
