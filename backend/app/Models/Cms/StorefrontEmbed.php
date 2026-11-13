<?php

namespace App\Models\Cms;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorefrontEmbed extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sandbox_token',
        'html_code',
        'css_code',
        'js_code',
        'is_sandboxed',
        'is_published',
        'created_by_user_id',
    ];

    protected $casts = [
        'is_sandboxed' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}

