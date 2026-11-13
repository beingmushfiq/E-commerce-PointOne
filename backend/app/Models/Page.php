<?php

namespace App\Models;

use App\Models\Cms\PageVersion;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'sections',
        'custom_css',
        'custom_js',
        'version',
        'is_system',
        'meta_title',
        'meta_description',
        'is_published',
    ];

    protected $casts = [
        'sections'     => 'array',
        'version'      => 'integer',
        'is_published' => 'boolean',
        'is_system'    => 'boolean',
    ];

    public function versions(): HasMany
    {
        return $this->hasMany(PageVersion::class)->orderByDesc('version_number');
    }
}
