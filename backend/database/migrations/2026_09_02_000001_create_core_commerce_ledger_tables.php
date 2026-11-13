<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Immutable Stock Movements Ledger
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->enum('movement_type', [
                'purchase_receipt',
                'sale',
                'reservation_hold',
                'reservation_release',
                'adjustment_in',
                'adjustment_out',
                'transfer_in',
                'transfer_out',
                'return_restock',
                'write_off',
                'opening_balance'
            ]);
            $table->integer('quantity'); // Positive for additions, negative for deductions
            $table->decimal('unit_cost', 12, 2)->default(0.00);
            $table->string('reference_type')->nullable(); // 'order', 'purchase_order', 'stock_transfer', 'inventory_audit'
            $table->string('reference_id')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['warehouse_id', 'product_id', 'product_variant_id']);
            $table->index(['reference_type', 'reference_id']);
        });

        // 2. Product Collections
        Schema::create('product_collections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('rules_json')->nullable();
            $table->timestamps();
        });

        // Product Collection Items
        Schema::create('product_collection_items', function (Blueprint $table) {
            $table->foreignId('product_collection_id')->constrained('product_collections')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->primary(['product_collection_id', 'product_id'], 'collection_product_primary');
        });

        // 3. Order State Transitions Audit Ledger
        Schema::create('order_state_transitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('from_status');
            $table->string('to_status');
            $table->string('actor_type')->nullable(); // 'customer', 'staff', 'system', 'gateway'
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'created_at']);
        });

        // 4. Add snapshot_data JSON to order_items if not present
        if (!Schema::hasColumn('order_items', 'snapshot_data')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->json('snapshot_data')->nullable()->after('total_price');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'snapshot_data')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn('snapshot_data');
            });
        }

        Schema::dropIfExists('order_state_transitions');
        Schema::dropIfExists('product_collection_items');
        Schema::dropIfExists('product_collections');
        Schema::dropIfExists('stock_movements');
    }
};

