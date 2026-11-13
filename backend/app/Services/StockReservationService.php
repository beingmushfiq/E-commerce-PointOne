<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockReservationService
{
    /**
     * Atomically reserve stock using pessimistic locking (SELECT ... FOR UPDATE).
     * Prevents race conditions and overselling during high-concurrency checkouts (SEC-05).
     *
     * @throws InsufficientStockException
     */
    public function reserveStock(
        int $warehouseId,
        int $productId,
        int $quantity,
        ?int $variantId = null,
        string $referenceType = 'order',
        string $referenceId = ''
    ): Stock {
        return DB::transaction(function () use ($warehouseId, $productId, $quantity, $variantId, $referenceType, $referenceId) {
            /** @var Stock|null $stock */
            $stock = Stock::where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->where('product_variant_id', $variantId)
                ->lockForUpdate()
                ->first();

            $available = $stock ? ($stock->quantity - $stock->reserved_quantity) : 0;

            if (!$stock || $available < $quantity) {
                throw new InsufficientStockException(
                    "Insufficient stock for product ID {$productId}. Available: {$available}, Requested: {$quantity}",
                    productId: $productId,
                    requestedQuantity: $quantity,
                    availableQuantity: $available
                );
            }

            // Increment reserved quantity
            $stock->increment('reserved_quantity', $quantity);

            // Record movement in the immutable ledger
            StockMovement::create([
                'warehouse_id'       => $warehouseId,
                'product_id'         => $productId,
                'product_variant_id' => $variantId,
                'movement_type'      => 'reservation_hold',
                'quantity'           => -$quantity,
                'unit_cost'          => 0.00,
                'reference_type'     => $referenceType,
                'reference_id'       => $referenceId,
                'notes'              => "Reserved {$quantity} units for {$referenceType} #{$referenceId}",
            ]);

            return $stock->fresh();
        });
    }

    /**
     * Release a previously held stock reservation.
     */
    public function releaseReservation(
        int $warehouseId,
        int $productId,
        int $quantity,
        ?int $variantId = null,
        string $referenceType = 'order',
        string $referenceId = ''
    ): void {
        DB::transaction(function () use ($warehouseId, $productId, $quantity, $variantId, $referenceType, $referenceId) {
            /** @var Stock|null $stock */
            $stock = Stock::where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->where('product_variant_id', $variantId)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                return;
            }

            $decrementAmount = min($stock->reserved_quantity, $quantity);
            $stock->decrement('reserved_quantity', $decrementAmount);

            StockMovement::create([
                'warehouse_id'       => $warehouseId,
                'product_id'         => $productId,
                'product_variant_id' => $variantId,
                'movement_type'      => 'reservation_release',
                'quantity'           => $decrementAmount,
                'unit_cost'          => 0.00,
                'reference_type'     => $referenceType,
                'reference_id'       => $referenceId,
                'notes'              => "Released {$decrementAmount} reserved units for {$referenceType} #{$referenceId}",
            ]);
        });
    }

    /**
     * Commit reserved stock into an official fulfilled sale deduction.
     */
    public function commitReservation(
        int $warehouseId,
        int $productId,
        int $quantity,
        ?int $variantId = null,
        string $referenceType = 'order',
        string $referenceId = '',
        float $unitCost = 0.00
    ): void {
        DB::transaction(function () use ($warehouseId, $productId, $quantity, $variantId, $referenceType, $referenceId, $unitCost) {
            /** @var Stock|null $stock */
            $stock = Stock::where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->where('product_variant_id', $variantId)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                return;
            }

            // Release from reservation and deduct from total on-hand quantity
            $stock->decrement('reserved_quantity', min($stock->reserved_quantity, $quantity));
            $stock->decrement('quantity', $quantity);

            // Also synchronize aggregate product quantity
            Product::where('id', $productId)->decrement('quantity', $quantity);

            StockMovement::create([
                'warehouse_id'       => $warehouseId,
                'product_id'         => $productId,
                'product_variant_id' => $variantId,
                'movement_type'      => 'sale',
                'quantity'           => -$quantity,
                'unit_cost'          => $unitCost,
                'reference_type'     => $referenceType,
                'reference_id'       => $referenceId,
                'notes'              => "Committed sale deduction of {$quantity} units for {$referenceType} #{$referenceId}",
            ]);
        });
    }

    /**
     * Add physical stock into a warehouse (purchase order, return restock, opening balance).
     */
    public function addStock(
        int $warehouseId,
        int $productId,
        int $quantity,
        float $unitCost = 0.00,
        string $movementType = 'purchase_receipt',
        string $referenceType = 'purchase_order',
        string $referenceId = '',
        ?int $actorId = null,
        string $notes = ''
    ): Stock {
        return DB::transaction(function () use ($warehouseId, $productId, $quantity, $unitCost, $movementType, $referenceType, $referenceId, $actorId, $notes) {
            $stock = Stock::firstOrCreate(
                [
                    'warehouse_id'       => $warehouseId,
                    'product_id'         => $productId,
                    'product_variant_id' => null,
                ],
                [
                    'quantity'          => 0,
                    'reserved_quantity' => 0,
                ]
            );

            $stock->increment('quantity', $quantity);
            Product::where('id', $productId)->increment('quantity', $quantity);

            StockMovement::create([
                'warehouse_id'       => $warehouseId,
                'product_id'         => $productId,
                'product_variant_id' => null,
                'movement_type'      => $movementType,
                'quantity'           => $quantity,
                'unit_cost'          => $unitCost,
                'reference_type'     => $referenceType,
                'reference_id'       => $referenceId,
                'actor_id'           => $actorId,
                'notes'              => $notes ?: "Received {$quantity} units via {$movementType}",
            ]);

            return $stock->fresh();
        });
    }
}

