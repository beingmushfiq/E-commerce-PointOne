<?php

namespace App\Models\Marketing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'meta_pixel_id',
        'encrypted_meta_capi_token',
        'meta_test_event_code',
        'ga4_measurement_id',
        'encrypted_ga4_api_secret',
        'enable_meta_capi',
        'enable_ga4',
        'default_consent_ad_storage',
        'default_consent_analytics',
    ];

    protected $casts = [
        'encrypted_meta_capi_token'  => 'encrypted',
        'encrypted_ga4_api_secret'   => 'encrypted',
        'enable_meta_capi'           => 'boolean',
        'enable_ga4'                 => 'boolean',
        'default_consent_ad_storage' => 'boolean',
        'default_consent_analytics'  => 'boolean',
    ];
}

