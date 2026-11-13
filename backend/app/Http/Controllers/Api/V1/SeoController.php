<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Seo\Services\SeoService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    public function __construct(
        protected SeoService $seoService
    ) {}

    /**
     * Deliver dynamic XML sitemap.
     */
    public function sitemap(): Response
    {
        $xml = $this->seoService->generateSitemapXml();

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * Deliver dynamic robots.txt.
     */
    public function robotsTxt(): Response
    {
        $txt = $this->seoService->generateRobotsTxt();

        return response($txt, 200)
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    /**
     * Return Schema.org JSON-LD and OpenGraph metadata for product page.
     */
    public function productJsonLd(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->with(['brand', 'category'])
            ->firstOrFail();

        $jsonLd = $this->seoService->generateProductJsonLd($product);

        $appUrl = rtrim(config('app.url', 'https://centerpoint.test'), '/');

        return response()->json([
            'status' => 'success',
            'data'   => [
                'json_ld'    => $jsonLd,
                'open_graph' => [
                    'og:title'       => $product->name,
                    'og:description' => $product->summary ?? $product->name,
                    'og:type'        => 'product',
                    'og:url'         => "{$appUrl}/products/{$product->slug}",
                    'og:image'       => $product->image_url ?: "{$appUrl}/assets/product-placeholder.png",
                    'product:price:amount'   => number_format((float) $product->price, 2, '.', ''),
                    'product:price:currency' => 'BDT',
                ],
                'twitter_card' => [
                    'twitter:card'        => 'summary_large_image',
                    'twitter:title'       => $product->name,
                    'twitter:description' => $product->summary ?? $product->name,
                    'twitter:image'       => $product->image_url ?: "{$appUrl}/assets/product-placeholder.png",
                ],
            ],
        ]);
    }

    /**
     * Return Schema.org BreadcrumbList JSON-LD.
     */
    public function breadcrumbJsonLd(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'crumbs'          => 'required|array|min:1',
            'crumbs.*.name'   => 'required|string',
            'crumbs.*.url'    => 'required|url',
        ]);

        $jsonLd = $this->seoService->generateBreadcrumbJsonLd($validated['crumbs']);

        return response()->json([
            'status' => 'success',
            'data'   => $jsonLd,
        ]);
    }
}

