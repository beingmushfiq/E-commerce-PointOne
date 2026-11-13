<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'type' => $this->type,
            'summary' => $this->summary,
            'description' => $this->description,
            'price' => (float) $this->price,
            'sale_price' => $this->sale_price ? (float) $this->sale_price : null,
            'quantity' => $this->quantity,
            'stock_quantity' => $this->quantity,
            'is_featured' => $this->is_featured,
            'image_url' => $this->image_url,
            'has_variants' => $this->has_variants,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'brand' => $this->whenLoaded('brand'),
            'variants' => $this->whenLoaded('variants'),
            'images' => $this->whenLoaded('images'),
        ];
    }
}
