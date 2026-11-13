<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CmsController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\MarketingController;
use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\FulfillmentController;
use App\Http\Controllers\Api\V1\AccountingController;
use App\Http\Controllers\Api\V1\Platform\PlatformDashboardController;
use App\Http\Controllers\Api\V1\Platform\TenantLifecycleController;
use App\Http\Controllers\Api\V1\Platform\PlanManagementController;
use App\Http\Controllers\Api\V1\Platform\StorefrontCustomizerController;
use App\Http\Controllers\Api\V1\AiAssistantController;
use App\Http\Controllers\Api\V1\SeoController;
use App\Http\Controllers\Api\V1\Admin\AdminCatalogController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminCmsContentController;

Route::prefix('v1')->group(function () {
    // Public Storefront Configuration & Theming
    Route::get('/storefront/config', [StorefrontCustomizerController::class, 'publicConfig']);
    Route::post('/platform/auth/mcp-login', [StorefrontCustomizerController::class, 'mcpLogin']);

    // Public Marketing & Tracking Routes
    Route::post('/marketing/apply-coupon', [MarketingController::class, 'applyCoupon']);
    Route::get('/marketing/flash-sales', [MarketingController::class, 'activeFlashSales']);
    Route::post('/marketing/subscribe', [MarketingController::class, 'subscribe']);
    Route::post('/marketing/events', [MarketingController::class, 'trackEvent']);
    Route::get('/marketing/feeds/google-merchant.xml', [MarketingController::class, 'googleMerchantFeed']);
    Route::get('/marketing/config', [MarketingController::class, 'config']);

    // Public SEO & Structured Data Routes
    Route::get('/seo/sitemap.xml', [SeoController::class, 'sitemap']);
    Route::get('/seo/robots.txt', [SeoController::class, 'robotsTxt']);
    Route::get('/seo/product/{slug}', [SeoController::class, 'productJsonLd']);
    Route::post('/seo/breadcrumbs', [SeoController::class, 'breadcrumbJsonLd']);

    // Public Cart & Checkout Routes
    Route::get('/cart', [CheckoutController::class, 'getCart']);
    Route::post('/cart/add', [CheckoutController::class, 'addToCart']);
    Route::post('/checkout/process', [CheckoutController::class, 'processCheckout']);

    // Public Catalog Routes
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'showProduct']);

    // Public CMS Routes
    Route::get('/cms/sliders', [CmsController::class, 'sliders']);
    Route::get('/cms/menus', [CmsController::class, 'menus']);
    Route::get('/cms/theme', [CmsController::class, 'theme']);
    Route::get('/cms/pages/{slug}', [CmsController::class, 'page']);
    Route::get('/cms/pages/{slug}/sections', [CmsController::class, 'pageSections']);
    Route::get('/cms/embeds/{token}/render', [CmsController::class, 'renderEmbed']);
    Route::get('/cms/blogs', [CmsController::class, 'blogPosts']);
    Route::get('/cms/blogs/{slug}', [CmsController::class, 'blogPost']);
    Route::get('/cms/faqs', [CmsController::class, 'faqs']);

    // Public Auth Routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Payment Callbacks & Webhooks
    Route::post('/payments/verify', [PaymentController::class, 'verify']);
    Route::post('/payments/webhook/{gateway}', [PaymentController::class, 'webhook']);

    // Fulfillment Webhooks
    Route::post('/fulfillment/webhook/{courier}', [FulfillmentController::class, 'webhook']);

    // Customer Shopping Assistant (Local-first, bilingual)
    Route::post('/ai/chat', [AiAssistantController::class, 'chat']);

    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Customer Profile & Wallet
        Route::get('/customer/addresses', [CustomerController::class, 'addresses']);
        Route::post('/customer/addresses', [CustomerController::class, 'storeAddress']);
        Route::get('/customer/wallet', [CustomerController::class, 'wallet']);
        Route::get('/customer/wishlist', [CustomerController::class, 'wishlist']);
        Route::post('/customer/wishlist/{productId}', [CustomerController::class, 'toggleWishlist']);
        Route::get('/customer/tickets', [CustomerController::class, 'tickets']);
        Route::post('/customer/tickets', [CustomerController::class, 'storeTicket']);

        // Order Tracking
        Route::get('/fulfillment/track/{consignmentId}', [FulfillmentController::class, 'track']);

        // Inventory & Fulfillment Operations (Restricted to Staff with inventory/catalog permissions or Admin)
        Route::middleware(['permission:manage-inventory,manage-catalog,admin'])->group(function () {
            Route::get('/inventory/warehouses', [InventoryController::class, 'warehouses']);
            Route::post('/inventory/warehouses', [InventoryController::class, 'storeWarehouse']);
            Route::get('/inventory/stocks', [InventoryController::class, 'stocks']);
            Route::get('/inventory/suppliers', [InventoryController::class, 'suppliers']);
            Route::post('/inventory/suppliers', [InventoryController::class, 'storeSupplier']);
            Route::get('/inventory/purchase-orders', [InventoryController::class, 'purchaseOrders']);

            // Consignment Booking
            Route::post('/fulfillment/book', [FulfillmentController::class, 'book']);
        });

        // Admin Analytics & Health Check (Restricted to Staff with access-admin permission or Admin)
        Route::middleware(['permission:access-admin,admin'])->group(function () {
            Route::get('/admin/analytics', [AdminDashboardController::class, 'analytics']);
            Route::get('/admin/logs', [AdminDashboardController::class, 'logs']);
            Route::get('/admin/health', [AdminDashboardController::class, 'health']);

            // Admin Operations for Products, Categories, Orders, Sliders, FAQs
            Route::post('/admin/products', [AdminCatalogController::class, 'storeProduct']);
            Route::put('/admin/products/{id}', [AdminCatalogController::class, 'updateProduct']);
            Route::delete('/admin/products/{id}', [AdminCatalogController::class, 'destroyProduct']);
            Route::post('/admin/categories', [AdminCatalogController::class, 'storeCategory']);
            Route::put('/admin/categories/{id}', [AdminCatalogController::class, 'updateCategory']);
            Route::delete('/admin/categories/{id}', [AdminCatalogController::class, 'destroyCategory']);

            Route::get('/admin/orders', [AdminOrderController::class, 'index']);
            Route::get('/admin/orders/{id}', [AdminOrderController::class, 'show']);
            Route::put('/admin/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

            Route::get('/admin/sliders', [AdminCmsContentController::class, 'sliders']);
            Route::post('/admin/sliders', [AdminCmsContentController::class, 'storeSlider']);
            Route::put('/admin/sliders/{id}', [AdminCmsContentController::class, 'updateSlider']);
            Route::delete('/admin/sliders/{id}', [AdminCmsContentController::class, 'destroySlider']);
            Route::get('/admin/faqs', [AdminCmsContentController::class, 'faqs']);
            Route::post('/admin/faqs', [AdminCmsContentController::class, 'storeFaq']);
            Route::put('/admin/faqs/{id}', [AdminCmsContentController::class, 'updateFaq']);
            Route::delete('/admin/faqs/{id}', [AdminCmsContentController::class, 'destroyFaq']);
        });

        // Financial & Double-Entry Accounting (Restricted to Staff with manage-finance permission or Admin)
        Route::middleware(['permission:manage-finance,admin'])->group(function () {
            Route::get('/accounting/accounts', [AccountingController::class, 'accounts']);
            Route::post('/accounting/accounts', [AccountingController::class, 'storeAccount']);
            Route::get('/accounting/journal-entries', [AccountingController::class, 'journalEntries']);
            Route::post('/accounting/journal-entries', [AccountingController::class, 'storeJournalEntry']);
            Route::post('/accounting/journal-entries/{id}/reverse', [AccountingController::class, 'reverseJournalEntry']);
            Route::get('/accounting/reports/trial-balance', [AccountingController::class, 'trialBalance']);
            Route::get('/accounting/reports/profit-and-loss', [AccountingController::class, 'profitAndLoss']);
            Route::get('/accounting/reports/balance-sheet', [AccountingController::class, 'balanceSheet']);
        });
        // CMS & Visual Page Builder (Restricted to Staff with manage-cms permission or Admin)
        Route::middleware(['permission:manage-cms,admin'])->group(function () {
            Route::get('/cms/admin/pages', [CmsController::class, 'adminPages']);
            Route::post('/cms/admin/pages', [CmsController::class, 'adminStorePage']);
            Route::put('/cms/admin/pages/{id}', [CmsController::class, 'adminUpdatePage']);
            Route::post('/cms/admin/pages/{id}/publish', [CmsController::class, 'adminPublishPage']);
            Route::post('/cms/admin/pages/{id}/rollback', [CmsController::class, 'adminRollbackPage']);
            Route::post('/cms/admin/embeds', [CmsController::class, 'adminStoreEmbed']);
            Route::put('/cms/admin/theme', [CmsController::class, 'adminUpdateTheme']);
        });

        // Platform Master Control Panel Operations
        Route::prefix('platform')->group(function () {
            // Omnipotent Storefront & Platform Customizer
            Route::get('/customizer/settings', [StorefrontCustomizerController::class, 'getMasterSettings']);
            Route::post('/customizer/settings', [StorefrontCustomizerController::class, 'updateSettings']);
            Route::post('/customizer/reset', [StorefrontCustomizerController::class, 'resetToDefaults']);

            Route::get('/kpis', [PlatformDashboardController::class, 'kpis']);
            Route::get('/health', [PlatformDashboardController::class, 'health']);
            Route::get('/audit-logs', [PlatformDashboardController::class, 'auditLogs']);

            Route::get('/tenants', [TenantLifecycleController::class, 'index']);
            Route::post('/tenants', [TenantLifecycleController::class, 'store']);
            Route::get('/tenants/{id}', [TenantLifecycleController::class, 'show']);
            Route::post('/tenants/{id}/suspend', [TenantLifecycleController::class, 'suspend']);
            Route::post('/tenants/{id}/activate', [TenantLifecycleController::class, 'activate']);

            Route::get('/plans', [PlanManagementController::class, 'index']);
            Route::post('/plans', [PlanManagementController::class, 'store']);
            Route::put('/plans/{id}', [PlanManagementController::class, 'update']);
        });

        // Staff AI Business Intelligence Assistant & Configuration
        Route::middleware(['permission:access-admin,admin'])->group(function () {
            Route::post('/ai/business-query', [AiAssistantController::class, 'businessQuery']);
            Route::get('/ai/config', [AiAssistantController::class, 'config']);
            Route::put('/ai/config', [AiAssistantController::class, 'updateConfig']);
        });

        // Marketing Administration & Attribution Analytics
        Route::middleware(['permission:manage-marketing,manage-catalog,admin'])->group(function () {
            Route::put('/marketing/config', [MarketingController::class, 'updateConfig']);
            Route::get('/marketing/events/log', [MarketingController::class, 'eventsLog']);
            Route::get('/marketing/attribution/stats', [MarketingController::class, 'attributionStats']);
        });
    });
});
