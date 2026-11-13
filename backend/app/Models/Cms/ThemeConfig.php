<?php

namespace App\Models\Cms;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThemeConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active',
        'tokens',
        'custom_css',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tokens'    => 'array',
    ];
}

