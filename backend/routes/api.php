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

Route::prefix('v1')->group(function () {
    // Public Marketing Routes
    Route::post('/marketing/apply-coupon', [MarketingController::class, 'applyCoupon']);
    Route::get('/marketing/flash-sales', [MarketingController::class, 'activeFlashSales']);
    Route::post('/marketing/subscribe', [MarketingController::class, 'subscribe']);

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
    Route::get('/cms/pages/{slug}', [CmsController::class, 'page']);
    Route::get('/cms/blogs', [CmsController::class, 'blogPosts']);
    Route::get('/cms/blogs/{slug}', [CmsController::class, 'blogPost']);
    Route::get('/cms/faqs', [CmsController::class, 'faqs']);

    // Public Auth Routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

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

        // Inventory Management (Restricted to Staff with inventory/catalog permissions or Admin)
        Route::middleware(['permission:manage-inventory,manage-catalog,admin'])->group(function () {
            Route::get('/inventory/warehouses', [InventoryController::class, 'warehouses']);
            Route::post('/inventory/warehouses', [InventoryController::class, 'storeWarehouse']);
            Route::get('/inventory/stocks', [InventoryController::class, 'stocks']);
            Route::get('/inventory/suppliers', [InventoryController::class, 'suppliers']);
            Route::post('/inventory/suppliers', [InventoryController::class, 'storeSupplier']);
            Route::get('/inventory/purchase-orders', [InventoryController::class, 'purchaseOrders']);
        });

        // Admin Analytics & Health Check (Restricted to Staff with access-admin permission or Admin)
        Route::middleware(['permission:access-admin,admin'])->group(function () {
            Route::get('/admin/analytics', [AdminDashboardController::class, 'analytics']);
            Route::get('/admin/logs', [AdminDashboardController::class, 'logs']);
            Route::get('/admin/health', [AdminDashboardController::class, 'health']);
        });
    });
});
