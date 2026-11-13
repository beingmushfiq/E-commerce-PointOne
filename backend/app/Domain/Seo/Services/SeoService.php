<?php

namespace App\Domain\Seo\Services;

use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Page;
use App\Models\Product;

class SeoService
{
    /**
     * Generate an authoritative XML Sitemap for Google, Bing, and Search Crawlers.
     */
    public function generateSitemapXml(): string
    {
        $appUrl = rtrim(config('app.url', 'https://centerpoint.test'), '/');

        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');

        // 1. Homepage
        $home = $xml->addChild('url');
        $home->addChild('loc', $appUrl);
        $home->addChild('changefreq', 'daily');
        $home->addChild('priority', '1.0');

        // 2. Categories
        $categories = Category::all();
        foreach ($categories as $cat) {
            $url = $xml->addChild('url');
            $url->addChild('loc', "{$appUrl}/categories/{$cat->slug}");
            $url->addChild('lastmod', $cat->updated_at?->toDateString() ?? now()->toDateString());
            $url->addChild('changefreq', 'weekly');
            $url->addChild('priority', '0.8');
        }

        // 3. Products
        $products = Product::where('quantity', '>', 0)->get();
        foreach ($products as $prod) {
            $url = $xml->addChild('url');
            $url->addChild('loc', "{$appUrl}/products/{$prod->slug}");
            $url->addChild('lastmod', $prod->updated_at?->toDateString() ?? now()->toDateString());
            $url->addChild('changefreq', 'daily');
            $url->addChild('priority', '0.9');
        }

        // 4. CMS Pages
        $pages = Page::where('is_published', true)->get();
        foreach ($pages as $page) {
            $url = $xml->addChild('url');
            $url->addChild('loc', "{$appUrl}/pages/{$page->slug}");
            $url->addChild('lastmod', $page->updated_at?->toDateString() ?? now()->toDateString());
            $url->addChild('changefreq', 'monthly');
            $url->addChild('priority', '0.5');
        }

        // 5. Blog Posts
        $posts = BlogPost::where('is_published', true)->get();
        foreach ($posts as $post) {
            $url = $xml->addChild('url');
            $url->addChild('loc', "{$appUrl}/blog/{$post->slug}");
            $url->addChild('lastmod', $post->updated_at?->toDateString() ?? now()->toDateString());
            $url->addChild('changefreq', 'weekly');
            $url->addChild('priority', '0.7');
        }

        return $xml->asXML();
    }

    /**
     * Generate dynamic robots.txt content with crawler governance and sitemap reference.
     */
    public function generateRobotsTxt(): string
    {
        $appUrl = rtrim(config('app.url', 'https://centerpoint.test'), '/');

        return implode("\n", [
            "User-agent: *",
            "Disallow: /admin/",
            "Disallow: /cart",
            "Disallow: /checkout",
            "Disallow: /api/",
            "Allow: /api/v1/marketing/feeds/",
            "",
            "Sitemap: {$appUrl}/sitemap.xml",
        ]);
    }

    /**
     * Generate rich Schema.org Product structured data (JSON-LD) for rich snippet eligibility.
     */
    public function generateProductJsonLd(Product $product): array
    {
        $appUrl = rtrim(config('app.url', 'https://centerpoint.test'), '/');

        return [
            '@context'    => 'https://schema.org',
            '@type'       => 'Product',
            'name'        => $product->name,
            'image'       => $product->image_url ?: "{$appUrl}/assets/product-placeholder.png",
            'description' => $product->summary ?? $product->name,
            'sku'         => $product->sku,
            'offers'      => [
                '@type'         => 'Offer',
                'url'           => "{$appUrl}/products/{$product->slug}",
                'priceCurrency' => 'BDT',
                'price'         => number_format((float) $product->price, 2, '.', ''),
                'availability'  => $product->quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'seller'        => [
                    '@type' => 'Organization',
                    'name'  => 'Centerpoint',
                ],
            ],
            'brand'       => [
                '@type' => 'Brand',
                'name'  => $product->brand?->name ?? 'Centerpoint',
            ],
        ];
    }

    /**
     * Generate rich Schema.org BreadcrumbList structured data.
     */
    public function generateBreadcrumbJsonLd(array $crumbs): array
    {
        $itemList = [];
        $position = 1;

        foreach ($crumbs as $crumb) {
            $itemList[] = [
                '@type'    => 'ListItem',
                'position' => $position++,
                'name'     => $crumb['name'],
                'item'     => $crumb['url'],
            ];
        }

        return [
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => $itemList,
        ];
    }
}

