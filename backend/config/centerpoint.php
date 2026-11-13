<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CENTERPOINT Deployment Edition
    |--------------------------------------------------------------------------
    |
    | Supported editions:
    | - 'standalone' : Single customer / single database deployment. Zero SaaS
    |                  dependencies. Management Studio & Storefront active.
    | - 'saas'       : Multi-tenant deployment with central DB + dynamic tenant DBs,
    |                  Master Control Panel, tenant provisioning and subscriptions.
    | - 'enterprise' : Dedicated single-tenant enterprise deployment with custom
    |                  integrations, SLAs, and dedicated hosting.
    |
    */

    'edition' => env('CENTERPOINT_EDITION', 'standalone'),

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenancy Configuration (SaaS Edition)
    |--------------------------------------------------------------------------
    */

    'tenancy' => [
        'central_connection' => env('CENTRAL_DB_CONNECTION', 'central'),
        'tenant_connection'  => env('TENANT_DB_CONNECTION', 'tenant'),
        'domain_suffix'      => env('TENANT_DOMAIN_SUFFIX', 'centerpoint.test'),
        'exempt_domains'     => [
            'localhost',
            '127.0.0.1',
            env('CENTRAL_DOMAIN', 'platform.centerpoint.test'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Entitlements & Module Toggles
    |--------------------------------------------------------------------------
    */

    'features' => [
        'multiple_storefronts'    => env('FEATURE_MULTIPLE_STOREFRONTS', false),
        'ai_assistant'            => env('FEATURE_AI_ASSISTANT', true),
        'marketing_capi'          => env('FEATURE_MARKETING_CAPI', true),
        'double_entry_accounting' => env('FEATURE_ACCOUNTING', true),
        'custom_code_sandbox'     => env('FEATURE_CUSTOM_CODE_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | cPanel / Shared Hosting Operational Profile
    |--------------------------------------------------------------------------
    */

    'cpanel' => [
        'enabled'                => env('CPANEL_MODE', false),
        'force_database_queue'   => env('CPANEL_FORCE_DB_QUEUE', false),
        'force_database_cache'   => env('CPANEL_FORCE_DB_CACHE', false),
        'max_cron_queue_jobs'    => env('CPANEL_MAX_QUEUE_JOBS', 20),
    ],

];

