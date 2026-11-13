<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Category;
use App\Http\Resources\ProductResource;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AdminCatalogController extends Controller
{
    /**
     * Store a newly created product in storage.
     */
    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|exists:categories,id',
            'price'          => 'required|numeric|min:0',
            'sale_price'     => 'nullable|numeric|min:0',
            'quantity'       => 'nullable|integer|min:0',
            'sku'            => 'nullable|string|max:100|unique:products,sku',
            'summary'        => 'nullable|string|max:500',
            'description'    => 'nullable|string',
            'is_featured'    => 'nullable|boolean',
            'is_active'      => 'nullable|boolean',
            'image_url'      => 'nullable|url',
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $count = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-" . (++$count);
        }

        $sku = !empty($validated['sku']) ? $validated['sku'] : 'CP-' . strtoupper(Str::random(8));

        $categoryId = $validated['category_id'] ?? null;
        if (!$categoryId) {
            $defaultCat = Category::firstOrCreate(
                ['slug' => 'general'],
                ['name' => 'General', 'is_active' => true, 'sort_order' => 1]
            );
            $categoryId = $defaultCat->id;
        }

        $product = Product::create([
            'name'          => $validated['name'],
            'slug'          => $slug,
            'sku'           => $sku,
            'type'          => 'physical',
            'category_id'   => $categoryId,
            'price'         => $validated['price'],
            'sale_price'    => $validated['sale_price'] ?? null,
            'quantity'      => $validated['quantity'] ?? 10,
            'summary'       => $validated['summary'] ?? null,
            'description'   => $validated['description'] ?? null,
            'is_featured'   => $validated['is_featured'] ?? false,
            'is_active'     => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['image_url'])) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $validated['image_url'],
                'is_primary' => true,
                'sort_order' => 1,
            ]);
        }

        $product->load(['category', 'images']);

        return response()->json([
            'status'  => 'success',
            'message' => 'Product created successfully',
            'data'    => new ProductResource($product),
        ], 201);
    }

    /**
     * Update an existing product.
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'price'       => 'nullable|numeric|min:0',
            'sale_price'  => 'nullable|numeric|min:0',
            'quantity'    => 'nullable|integer|min:0',
            'sku'         => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'summary'     => 'nullable|string',
            'description' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'is_active'   => 'nullable|boolean',
            'image_url'   => 'nullable|url',
        ]);

        $product->update(array_filter($validated, fn ($k) => $k !== 'image_url', ARRAY_FILTER_USE_KEY));

        if (!empty($validated['image_url'])) {
            $primaryImage = $product->images()->where('is_primary', true)->first();
            if ($primaryImage) {
                $primaryImage->update(['image_path' => $validated['image_url']]);
            } else {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $validated['image_url'],
                    'is_primary' => true,
                    'sort_order' => 1,
                ]);
            }
        }

        $product->load(['category', 'images']);

        return response()->json([
            'status'  => 'success',
            'message' => 'Product updated successfully',
            'data'    => new ProductResource($product),
        ]);
    }

    /**
     * Delete/archive a product.
     */
    public function destroyProduct(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Product removed successfully',
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'parent_id'   => 'nullable|exists:categories,id',
            'is_active'   => 'nullable|boolean',
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $count = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-" . (++$count);
        }

        $category = Category::create([
            'name'        => $validated['name'],
            'slug'        => $slug,
            'description' => $validated['description'] ?? null,
            'parent_id'   => $validated['parent_id'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
            'sort_order'  => (Category::max('sort_order') ?? 0) + 1,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Category created successfully',
            'data'    => new CategoryResource($category),
        ], 201);
    }

    /**
     * Update an existing category.
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_active'   => 'nullable|boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Category updated successfully',
            'data'    => new CategoryResource($category),
        ]);
    }

    /**
     * Delete a category.
     */
    public function destroyCategory(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Category deleted successfully',
        ]);
    }
}
