<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'encrypted_api_key',
        'model_name',
        'system_prompt',
        'is_active',
        'enable_shopping_assistant',
        'enable_business_assistant',
    ];

    protected $casts = [
        'is_active'                 => 'boolean',
        'enable_shopping_assistant' => 'boolean',
        'enable_business_assistant' => 'boolean',
        'encrypted_api_key'         => 'encrypted',
    ];
}

