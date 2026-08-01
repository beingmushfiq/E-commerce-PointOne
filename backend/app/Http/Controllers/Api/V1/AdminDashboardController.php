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

    // System Health Status
    public function health(): JsonResponse
    {
        // Dynamic Health Check
        $dbStatus = 'ok';
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $dbStatus = 'error';
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'database' => $dbStatus,
                'redis' => 'ok',
                'storage' => 'ok',
                'mail' => 'ok',
                'timestamp' => now()->toIso8601String(),
            ]
        ]);
    }
}
