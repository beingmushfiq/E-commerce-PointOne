<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'name',
        'slug',
        'price',
        'billing_period',
        'features_json',
        'limits_json',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features_json' => 'array',
        'limits_json' => 'array',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $feature): bool
    {
        return ($this->features_json[$feature] ?? false) === true;
    }

    public function getLimit(string $limitKey, int $default = 0): int
    {
        return $this->limits_json[$limitKey] ?? $default;
    }
}

