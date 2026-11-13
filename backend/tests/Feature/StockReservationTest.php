<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStockException;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Services\StockReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockReservationTest extends TestCase
{
    use RefreshDatabase;

    protected Warehouse $warehouse;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create(['name' => 'Leather', 'slug' => 'leather']);
        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Handcrafted Wallet',
            'slug' => 'handcrafted-wallet',
            'sku' => 'WAL-001',
            'price' => 1200.00,
            'quantity' => 10,
        ]);

        $this->warehouse = Warehouse::create([
            'name' => 'Dhaka Central Hub',
            'code' => 'DHK-01',
            'address' => 'Tejgaon Industrial Area',
            'city' => 'Dhaka',
            'country' => 'Bangladesh',
            'is_active' => true,
        ]);
    }

    public function test_can_add_stock_and_record_movement(): void
    {
        $service = new StockReservationService();
        $stock = $service->addStock(
            warehouseId: $this->warehouse->id,
            productId: $this->product->id,
            quantity: 50,
            unitCost: 800.00,
            movementType: 'purchase_receipt',
            referenceType: 'purchase_order',
            referenceId: 'PO-9912'
        );

        $this->assertEquals(50, $stock->quantity);
        $this->assertEquals(0, $stock->reserved_quantity);
        $this->assertEquals(50, $stock->available_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $this->product->id,
            'movement_type' => 'purchase_receipt',
            'quantity' => 50,
        ]);
    }

    public function test_stock_reservation_decrements_available_without_altering_on_hand(): void
    {
        $service = new StockReservationService();
        $service->addStock($this->warehouse->id, $this->product->id, 20);

        // Reserve 5 units for an order
        $stock = $service->reserveStock(
            warehouseId: $this->warehouse->id,
            productId: $this->product->id,
            quantity: 5,
            referenceType: 'order',
            referenceId: 'ORD-881'
        );

        $this->assertEquals(20, $stock->quantity); // On-hand untouched
        $this->assertEquals(5, $stock->reserved_quantity);
        $this->assertEquals(15, $stock->available_quantity); // Available reduced
    }

    public function test_reserving_more_than_available_throws_exception(): void
    {
        $service = new StockReservationService();
        $service->addStock($this->warehouse->id, $this->product->id, 3);

        $this->expectException(InsufficientStockException::class);

        // Attempt to reserve 5 when only 3 are available
        $service->reserveStock($this->warehouse->id, $this->product->id, 5);
    }

    public function test_commit_reservation_deducts_on_hand_and_creates_sale_movement(): void
    {
        $service = new StockReservationService();
        $service->addStock($this->warehouse->id, $this->product->id, 10);
        $service->reserveStock($this->warehouse->id, $this->product->id, 4);

        $service->commitReservation(
            warehouseId: $this->warehouse->id,
            productId: $this->product->id,
            quantity: 4,
            referenceType: 'order',
            referenceId: 'ORD-992'
        );

        $stock = Stock::where('warehouse_id', $this->warehouse->id)->where('product_id', $this->product->id)->first();
        $this->assertEquals(6, $stock->quantity);
        $this->assertEquals(0, $stock->reserved_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'movement_type' => 'sale',
            'quantity' => -4,
            'reference_id' => 'ORD-992',
        ]);
    }
}

