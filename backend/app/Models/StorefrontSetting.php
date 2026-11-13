<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class StorefrontSetting extends Model
{
    protected $fillable = [
        'key',
        'group',
        'value',
        'type',
        'is_secret',
    ];

    protected $casts = [
        'is_secret' => 'boolean',
    ];

    /**
     * Get typed value dynamically.
     */
    public function getParsedValue(): mixed
    {
        if ($this->value === null) {
            return null;
        }

        $raw = $this->value;

        if ($this->is_secret) {
            try {
                $raw = Crypt::decryptString($raw);
            } catch (\Exception $e) {
                return null;
            }
        }

        return match ($this->type) {
            'boolean' => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $raw,
            'float'   => (float) $raw,
            'json'    => json_decode($raw, true),
            default   => $raw,
        };
    }

    /**
     * Set typed value with encryption if secret.
     */
    public function setParsedValue(mixed $val): void
    {
        $raw = match ($this->type) {
            'json'    => json_encode($val),
            'boolean' => $val ? '1' : '0',
            default   => (string) $val,
        };

        if ($this->is_secret && !empty($raw)) {
            $this->attributes['value'] = Crypt::encryptString($raw);
        } else {
            $this->attributes['value'] = $raw;
        }
    }

    /**
     * Retrieve all settings grouped for public storefront (masking secrets).
     */
    public static function getPublicConfig(): array
    {
        return Cache::remember('storefront_public_config', 3600, function () {
            $settings = self::all();
            if ($settings->isEmpty()) {
                self::seedDefaults();
                $settings = self::all();
            }

            $grouped = [];
            foreach ($settings as $setting) {
                if ($setting->is_secret) {
                    continue; // Never expose secret keys in public config
                }
                $grouped[$setting->group][$setting->key] = $setting->getParsedValue();
            }

            return $grouped;
        });
    }

    /**
     * Retrieve all settings for Master Control Panel (including masked secrets).
     */
    public static function getMasterConfig(): array
    {
        $settings = self::all();
        if ($settings->isEmpty()) {
            self::seedDefaults();
            $settings = self::all();
        }

        $grouped = [];
        foreach ($settings as $setting) {
            $grouped[$setting->group][$setting->key] = [
                'value'     => $setting->is_secret ? '••••••••' : $setting->getParsedValue(),
                'type'      => $setting->type,
                'is_secret' => $setting->is_secret,
            ];
        }

        return $grouped;
    }

    /**
     * Clear config cache upon update.
     */
    public static function flushCache(): void
    {
        Cache::forget('storefront_public_config');
    }

    /**
     * Seed initial vetted luxury defaults.
     */
    public static function seedDefaults(): void
    {
        $defaults = [
            // Theme
            ['key' => 'default_mode', 'group' => 'theme', 'type' => 'string', 'value' => 'light'],
            ['key' => 'font_heading', 'group' => 'theme', 'type' => 'string', 'value' => 'Cormorant Garamond'],
            ['key' => 'font_body', 'group' => 'theme', 'type' => 'string', 'value' => 'Plus Jakarta Sans'],
            ['key' => 'accent_color', 'group' => 'theme', 'type' => 'string', 'value' => '#D97706'],
            ['key' => 'border_radius', 'group' => 'theme', 'type' => 'string', 'value' => '16px'],
            ['key' => 'glass_blur', 'group' => 'theme', 'type' => 'string', 'value' => '16px'],

            // Motion (5 styles)
            ['key' => 'active_motion_style', 'group' => 'motion', 'type' => 'string', 'value' => 'editorial_flow'],
            ['key' => 'enable_smooth_scroll', 'group' => 'motion', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_preloader', 'group' => 'motion', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'magnetic_buttons', 'group' => 'motion', 'type' => 'boolean', 'value' => '1'],

            // Currency
            ['key' => 'default_currency', 'group' => 'currency', 'type' => 'string', 'value' => 'BDT'],
            ['key' => 'currency_symbol', 'group' => 'currency', 'type' => 'string', 'value' => '৳'],
            ['key' => 'supported_currencies', 'group' => 'currency', 'type' => 'json', 'value' => json_encode(['BDT', 'USD', 'EUR'])],
            ['key' => 'exchange_rates', 'group' => 'currency', 'type' => 'json', 'value' => json_encode(['BDT' => 1.0, 'USD' => 0.00833, 'EUR' => 0.00781])],

            // Branding (DevCenterPoint Integration)
            ['key' => 'creator_name', 'group' => 'branding', 'type' => 'string', 'value' => 'DevCenterPoint'],
            ['key' => 'creator_url', 'group' => 'branding', 'type' => 'string', 'value' => 'https://devcenterpoint.com'],
            ['key' => 'creator_tagline', 'group' => 'branding', 'type' => 'string', 'value' => 'Engineered by DevCenterPoint'],
            ['key' => 'show_creator_attribution', 'group' => 'branding', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'product_name', 'group' => 'branding', 'type' => 'string', 'value' => 'CENTERPOINT'],
            ['key' => 'tagline', 'group' => 'branding', 'type' => 'string', 'value' => 'One Platform. Complete Commerce.'],

            // Storefront Content & Sections
            ['key' => 'ticker_announcement', 'group' => 'header', 'type' => 'string', 'value' => 'COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ৳ 50,000 | WORLDWIDE CONCIERGE'],
            ['key' => 'ticker_speed', 'group' => 'header', 'type' => 'integer', 'value' => '30'],
            ['key' => 'hero_title', 'group' => 'sections', 'type' => 'string', 'value' => 'Crafted for Modern Living. Thoughtfully Curated.'],
            ['key' => 'hero_subtitle', 'group' => 'sections', 'type' => 'string', 'value' => 'Bespoke timepieces, artisanal apparel, and refined modern essentials crafted with generational mastery.'],
            ['key' => 'hero_cta_primary', 'group' => 'sections', 'type' => 'string', 'value' => 'Explore Grand Collection'],
            ['key' => 'hero_cta_secondary', 'group' => 'sections', 'type' => 'string', 'value' => 'The Horology Editorial'],

            // Integrations
            ['key' => 'enable_bkash', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_sslcommerz', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_nagad', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_cod', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_steadfast', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_pathao', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'enable_ai_assistant', 'group' => 'integrations', 'type' => 'boolean', 'value' => '1'],
            ['key' => 'ai_assistant_greeting_bn', 'group' => 'integrations', 'type' => 'string', 'value' => 'স্বাগতম! আমি সেন্টারপয়েন্ট শপিং অ্যাসিস্ট্যান্ট। কীভাবে আপনাকে সাহায্য করতে পারি?'],
            ['key' => 'ai_assistant_greeting_en', 'group' => 'integrations', 'type' => 'string', 'value' => 'Welcome to CENTERPOINT. How may I assist your curation today?'],
        ];

        foreach ($defaults as $item) {
            self::updateOrCreate(
                ['key' => $item['key']],
                [
                    'group'     => $item['group'],
                    'type'      => $item['type'],
                    'value'     => $item['value'],
                    'is_secret' => false,
                ]
            );
        }

        self::flushCache();
    }
}

