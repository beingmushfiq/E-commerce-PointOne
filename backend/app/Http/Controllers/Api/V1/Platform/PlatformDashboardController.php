<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Central\Plan;
use App\Models\Central\PlatformAuditLog;
use App\Models\Central\Subscription;
use App\Models\Central\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PlatformDashboardController extends Controller
{
    /**
     * Compute authoritative, real platform operational KPIs across tenants and subscriptions.
     */
    public function kpis(): JsonResponse
    {
        // 1. Tenant Metrics (Real DB queries against central schema)
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();

        // 2. Subscription & Revenue Metrics
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $trialingSubscriptions = Subscription::where('status', 'trialing')->count();

        // Compute Monthly Recurring Revenue (MRR) based on active plans
        $activeSubsWithPlans = Subscription::with('plan')
            ->where('status', 'active')
            ->get();

        $mrr = 0.0;
        foreach ($activeSubsWithPlans as $sub) {
            if ($sub->plan) {
                $price = (float) $sub->plan->price;
                $mrr += ($sub->plan->billing_period === 'yearly') ? ($price / 12) : $price;
            }
        }

        // 3. System Storage Estimation
        $storageBytes = 0;
        $storagePath = storage_path('app');
        if (file_exists($storagePath)) {
            // Fast estimate of platform storage
            $storageBytes = @disk_total_space($storagePath) ?: 0;
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'tenants' => [
                    'total'     => $totalTenants,
                    'active'    => $activeTenants,
                    'suspended' => $suspendedTenants,
                ],
                'subscriptions' => [
                    'active'   => $activeSubscriptions,
                    'trialing' => $trialingSubscriptions,
                    'mrr'      => round($mrr, 2),
                    'arr'      => round($mrr * 12, 2),
                ],
                'plans_count' => Plan::count(),
                'timestamp'   => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * SEC-06 Remediation: Authoritative system health diagnostics with real runtime probes.
     */
    public function health(): JsonResponse
    {
        // 1. Central Database Probe
        $centralDbStatus = 'ok';
        $centralDbLatency = 0.0;
        try {
            $start = microtime(true);
            DB::connection('central')->getPdo();
            $centralDbLatency = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $centralDbStatus = 'error: ' . $e->getMessage();
        }

        // 2. Real Disk Write & Read Probe
        $storageStatus = 'ok';
        try {
            $probeFile = storage_path('framework/cache/probe_platform_' . uniqid() . '.tmp');
            file_put_contents($probeFile, 'platform-health-check');
            if (!file_exists($probeFile) || file_get_contents($probeFile) !== 'platform-health-check') {
                $storageStatus = 'error: write verification failed';
            }
            @unlink($probeFile);
        } catch (\Throwable $e) {
            $storageStatus = 'error: ' . $e->getMessage();
        }

        // 3. Real Cache Driver Probe
        $cacheStatus = 'ok';
        try {
            $cacheKey = 'platform_probe_' . uniqid();
            Cache::put($cacheKey, 'alive', 5);
            if (Cache::get($cacheKey) !== 'alive') {
                $cacheStatus = 'error: cache readback mismatch';
            }
            Cache::forget($cacheKey);
        } catch (\Throwable $e) {
            $cacheStatus = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'central_database' => $centralDbStatus,
                'latency_ms'       => $centralDbLatency,
                'cache'            => $cacheStatus,
                'storage'          => $storageStatus,
                'php_version'      => PHP_VERSION,
                'timestamp'        => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get paginated platform audit logs.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = PlatformAuditLog::with(['admin:id,name,email', 'tenant:id,name,slug'])
            ->latest('id');

        if ($request->has('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->has('tenant_id')) {
            $query->where('tenant_id', $request->query('tenant_id'));
        }

        $logs = $query->paginate($request->query('per_page', 25));

        return response()->json([
            'status' => 'success',
            'data'   => $logs,
        ]);
    }
}

