<?php

namespace App\Domain\Marketing\Services;

use App\Models\Product;

class ProductFeedService
{
    /**
     * Generate an authoritative, valid Google Merchant Center RSS 2.0 XML product feed.
     */
    public function generateGoogleMerchantXml(): string
    {
        $products = Product::where('quantity', '>', 0)
            ->with(['brand', 'category'])
            ->get();

        $appUrl = rtrim(config('app.url', 'https://centerpoint.test'), '/');

        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"></rss>');
        $channel = $xml->addChild('channel');

        $channel->addChild('title', 'CENTERPOINT Luxury Catalog');
        $channel->addChild('link', $appUrl);
        $channel->addChild('description', htmlspecialchars('Authoritative product feed for Google Shopping & Merchant Center'));

        foreach ($products as $product) {
            $item = $channel->addChild('item');
            $item->addChild('g:id', (string) $product->sku, 'http://base.google.com/ns/1.0');
            $item->addChild('g:title', htmlspecialchars($product->name), 'http://base.google.com/ns/1.0');
            $item->addChild('g:description', htmlspecialchars($product->summary ?? $product->name), 'http://base.google.com/ns/1.0');
            $item->addChild('g:link', "{$appUrl}/products/{$product->slug}", 'http://base.google.com/ns/1.0');

            $imageLink = $product->image_url ?: "{$appUrl}/assets/product-placeholder.png";
            $item->addChild('g:image_link', $imageLink, 'http://base.google.com/ns/1.0');

            $availability = $product->quantity > 0 ? 'in_stock' : 'out_of_stock';
            $item->addChild('g:availability', $availability, 'http://base.google.com/ns/1.0');

            $formattedPrice = number_format((float) $product->price, 2, '.', '') . ' BDT';
            $item->addChild('g:price', $formattedPrice, 'http://base.google.com/ns/1.0');

            $brandName = $product->brand?->name ?? 'Centerpoint';
            $item->addChild('g:brand', htmlspecialchars($brandName), 'http://base.google.com/ns/1.0');
            $item->addChild('g:condition', 'new', 'http://base.google.com/ns/1.0');
        }

        return $xml->asXML();
    }
}
