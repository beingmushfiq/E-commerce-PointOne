<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'is_featured',
        'is_active',
        'rules_json',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'rules_json' => 'array',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_collection_items')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order', 'asc');
    }
}

