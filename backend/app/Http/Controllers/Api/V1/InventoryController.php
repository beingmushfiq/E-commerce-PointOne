<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    // Warehouses
    public function warehouses(): JsonResponse
    {
        $warehouses = Warehouse::withCount('stocks')->get();
        return response()->json(['status' => 'success', 'data' => $warehouses]);
    }

    public function storeWarehouse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses',
            'address' => 'required|string',
            'city' => 'required|string',
            'country' => 'required|string',
        ]);

        $warehouse = Warehouse::create($validated);
        return response()->json(['status' => 'success', 'data' => $warehouse], 201);
    }

    // Stocks & Low Stock Alerts
    public function stocks(Request $request): JsonResponse
    {
        $query = Stock::with(['warehouse', 'product', 'variant']);

        if ($request->has('low_stock')) {
            $query->whereColumn('quantity', '<=', 'low_stock_threshold');
        }

        $stocks = $query->paginate($request->query('per_page', 20));
        return response()->json(['status' => 'success', 'data' => $stocks->items(), 'meta' => [
            'current_page' => $stocks->currentPage(),
            'total' => $stocks->total(),
        ]]);
    }

    // Suppliers
    public function suppliers(): JsonResponse
    {
        $suppliers = Supplier::all();
        return response()->json(['status' => 'success', 'data' => $suppliers]);
    }

    public function storeSupplier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'company_name' => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json(['status' => 'success', 'data' => $supplier], 201);
    }

    // Purchase Orders
    public function purchaseOrders(): JsonResponse
    {
        $pos = PurchaseOrder::with(['supplier', 'warehouse', 'items'])->latest()->get();
        return response()->json(['status' => 'success', 'data' => $pos]);
    }

    public function storePurchaseOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $totalCost = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_cost']);

        $po = PurchaseOrder::create([
            'supplier_id' => $validated['supplier_id'],
            'warehouse_id' => $validated['warehouse_id'],
            'po_number' => 'PO-' . strtoupper(Str::random(8)),
            'status' => 'draft',
            'total_cost' => $totalCost,
        ]);

        foreach ($validated['items'] as $item) {
            $po->items()->create([
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $item['quantity'] * $item['unit_cost'],
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $po->load('items')], 201);
    }
}
