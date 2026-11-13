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
        // 1. Payment Idempotency Keys (Deduplication & Replay Protection)
        Schema::create('payment_idempotency_keys', function (Blueprint $table) {
            $table->id();
            $table->string('idempotency_key')->unique();
            $table->string('provider', 50);
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->json('response_payload')->nullable();
            $table->timestamps();

            $table->index(['provider', 'order_id']);
        });

        // 2. Courier Shipments & Logistics Tracking
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('courier_name', 50); // 'steadfast', 'pathao', 'redx', 'self'
            $table->string('consignment_id')->nullable()->index();
            $table->string('tracking_code')->nullable()->index();
            $table->enum('status', [
                'pending',
                'booked',
                'in_transit',
                'out_for_delivery',
                'delivered',
                'returned',
                'cancelled',
                'failed'
            ])->default('pending');
            $table->decimal('cod_amount', 12, 2)->default(0.00);
            $table->decimal('shipping_cost', 12, 2)->default(0.00);
            $table->text('label_url')->nullable();
            $table->json('pickup_address')->nullable();
            $table->json('delivery_address');
            $table->json('courier_response')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('payment_idempotency_keys');
    }
};

