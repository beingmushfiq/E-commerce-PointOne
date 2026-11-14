<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\SystemHealthCheck;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    // Dashboard KPI Analytics Summary
    public function analytics(): JsonResponse
    {
        $totalSales = Order::where('payment_status', 'paid')->sum('grand_total');
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        $totalCustomers = User::count();

        $recentOrders = Order::with('user:id,name,email')
            ->latest()
            ->take(5)
            ->get();

        $driver = DB::connection()->getDriverName();
        $monthRaw = $driver === 'sqlite' 
            ? "strftime('%Y-%m', created_at) as month" 
            : "DATE_FORMAT(created_at, '%Y-%m') as month";

        $salesByMonth = Order::select(
            DB::raw($monthRaw),
            DB::raw('SUM(grand_total) as total')
        )
        ->where('payment_status', 'paid')
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->take(6)
        ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'kpi' => [
                    'total_sales' => (float) $totalSales,
                    'total_orders' => $totalOrders,
                    'total_products' => $totalProducts,
                    'total_customers' => $totalCustomers,
                ],
                'recent_orders' => $recentOrders,
                'sales_chart' => $salesByMonth,
            ]
        ]);
    }

    // Audit Logs
    public function logs(): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')->latest()->paginate(20);
        return response()->json(['status' => 'success', 'data' => $logs->items(), 'meta' => [
            'current_page' => $logs->currentPage(),
            'total' => $logs->total(),
        ]]);
    }

    // System Health Status (SEC-06 Remediated: Real Dynamic Diagnostics)
    public function health(): JsonResponse
    {
        // 1. Real Database Probe
        $dbStatus = 'ok';
        $dbLatency = 0.0;
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $dbLatency = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        // 2. Real Storage Write & Read Probe
        $storageStatus = 'ok';
        try {
            $probeFile = storage_path('framework/cache/probe_' . uniqid() . '.tmp');
            file_put_contents($probeFile, 'health-check');
            if (!file_exists($probeFile) || file_get_contents($probeFile) !== 'health-check') {
                $storageStatus = 'error: write verification failed';
            }
            @unlink($probeFile);
        } catch (\Throwable $e) {
            $storageStatus = 'error: ' . $e->getMessage();
        }

        // 3. Real Cache Probe
        $cacheStatus = 'ok';
        try {
            $cacheKey = 'probe_' . uniqid();
            \Illuminate\Support\Facades\Cache::put($cacheKey, 'alive', 5);
            if (\Illuminate\Support\Facades\Cache::get($cacheKey) !== 'alive') {
                $cacheStatus = 'error: readback failed';
            }
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
        } catch (\Throwable $e) {
            $cacheStatus = 'error: ' . $e->getMessage();
        }

        // 4. Real Mail Configuration Probe
        $mailStatus = 'ok';
        $mailDriver = config('mail.default');
        if (empty($mailDriver) || ($mailDriver === 'smtp' && empty(config('mail.mailers.smtp.host')))) {
            $mailStatus = 'unconfigured';
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'database'     => $dbStatus,
                'db_latency_ms'=> $dbLatency,
                'cache'        => $cacheStatus,
                'storage'      => $storageStatus,
                'mail'         => $mailStatus,
                'timestamp'    => now()->toIso8601String(),
            ],
        ]);
    }

    // Get Store Operational Settings for Store Studio
    public function storeSettings(): JsonResponse
    {
        $siteName = \App\Models\StorefrontSetting::where('key', 'brand.site_name')->first()?->getParsedValue() ?? 'CENTERPOINT Flagship Store';
        $supportEmail = \App\Models\StorefrontSetting::where('key', 'contact.support_email')->first()?->getParsedValue() ?? 'concierge@centerpoint.atelier';
        $supportPhone = \App\Models\StorefrontSetting::where('key', 'contact.support_phone')->first()?->getParsedValue() ?? '+880 1712-345678';
        $vatRate = \App\Models\StorefrontSetting::where('key', 'finance.vat_rate')->first()?->getParsedValue() ?? 5;
        $lowStock = \App\Models\StorefrontSetting::where('key', 'inventory.low_stock_threshold')->first()?->getParsedValue() ?? 5;

        $team = User::with('roles')->get()->map(fn($u) => [
            'id'     => $u->id,
            'name'   => $u->name,
            'email'  => $u->email,
            'role'   => $u->roles->first()?->name ?? 'Staff',
            'status' => 'Active',
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'storeName'        => $siteName,
                'supportEmail'     => $supportEmail,
                'supportPhone'     => $supportPhone,
                'vatRate'          => (int) $vatRate,
                'lowStockThreshold'=> (int) $lowStock,
                'team'             => $team,
            ],
        ]);
    }

    // Update Store Operational Settings for Store Studio
    public function updateStoreSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'storeName'        => 'nullable|string|max:255',
            'supportEmail'     => 'nullable|email|max:255',
            'supportPhone'     => 'nullable|string|max:50',
            'vatRate'          => 'nullable|numeric|min:0|max:100',
            'lowStockThreshold'=> 'nullable|integer|min:1',
        ]);

        if (isset($validated['storeName'])) {
            \App\Models\StorefrontSetting::updateOrCreate(
                ['key' => 'brand.site_name'],
                ['group' => 'brand', 'value' => $validated['storeName'], 'type' => 'string', 'is_secret' => false]
            );
        }
        if (isset($validated['supportEmail'])) {
            \App\Models\StorefrontSetting::updateOrCreate(
                ['key' => 'contact.support_email'],
                ['group' => 'contact', 'value' => $validated['supportEmail'], 'type' => 'string', 'is_secret' => false]
            );
        }
        if (isset($validated['supportPhone'])) {
            \App\Models\StorefrontSetting::updateOrCreate(
                ['key' => 'contact.support_phone'],
                ['group' => 'contact', 'value' => $validated['supportPhone'], 'type' => 'string', 'is_secret' => false]
            );
        }
        if (isset($validated['vatRate'])) {
            \App\Models\StorefrontSetting::updateOrCreate(
                ['key' => 'finance.vat_rate'],
                ['group' => 'finance', 'value' => (string) $validated['vatRate'], 'type' => 'integer', 'is_secret' => false]
            );
        }
        if (isset($validated['lowStockThreshold'])) {
            \App\Models\StorefrontSetting::updateOrCreate(
                ['key' => 'inventory.low_stock_threshold'],
                ['group' => 'inventory', 'value' => (string) $validated['lowStockThreshold'], 'type' => 'integer', 'is_secret' => false]
            );
        }

        \Illuminate\Support\Facades\Cache::forget('storefront_settings.public');

        return response()->json([
            'status'  => 'success',
            'message' => 'Store operational settings updated successfully',
        ]);
    }
}
