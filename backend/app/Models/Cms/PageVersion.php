<?php

namespace App\Models\Cms;

use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'version_number',
        'sections',
        'custom_css',
        'custom_js',
        'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'sections'       => 'array',
        'version_number' => 'integer',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}

