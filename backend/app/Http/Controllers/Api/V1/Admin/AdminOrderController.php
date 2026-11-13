<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminOrderController extends Controller
{
    /**
     * List paginated orders for Admin Studio.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user:id,name,email', 'items.product'])
            ->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->paginate($request->query('per_page', 25));

        return response()->json([
            'status' => 'success',
            'data'   => $orders->items(),
            'meta'   => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /**
     * Get single order detail.
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['user:id,name,email', 'items.product'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $order,
        ]);
    }

    /**
     * Update order status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,paid,processing,shipped,delivered,cancelled',
        ]);

        $order->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Order #{$order->order_number} marked as " . ucfirst($validated['status']),
            'data'    => $order->fresh(['user:id,name,email', 'items.product']),
        ]);
    }
}
