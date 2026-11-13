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
        // 1. Canonical Marketing Events (Server-Side CAPI & Deduplication)
        Schema::create('marketing_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 64)->unique(); // Shared deduplication ID between browser and server
            $table->string('event_name', 50); // PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('session_id', 100)->nullable();
            $table->string('event_source', 20)->default('server'); // server, browser
            $table->json('user_data')->nullable(); // SHA-256 hashed email, phone, client_ip, user_agent, fbp, fbc
            $table->json('custom_data')->nullable(); // currency, value, contents, content_ids, num_items
            $table->string('status', 20)->default('pending'); // pending, dispatched, failed
            $table->text('error_message')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamps();

            $table->index(['event_name', 'status']);
            $table->index(['created_at']);
        });

        // 2. First-Party Order Attribution (UTM & Referrer tracking)
        Schema::create('order_attributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();
            $table->string('utm_content', 100)->nullable();
            $table->string('utm_term', 100)->nullable();
            $table->string('referrer_url', 500)->nullable();
            $table->string('landing_page', 500)->nullable();
            $table->string('fbclid', 150)->nullable();
            $table->string('gclid', 150)->nullable();
            $table->timestamps();

            $table->index(['utm_source', 'utm_campaign']);
        });

        // 3. Marketing & Tracking Configuration
        Schema::create('marketing_configs', function (Blueprint $table) {
            $table->id();
            $table->string('meta_pixel_id', 50)->nullable();
            $table->text('encrypted_meta_capi_token')->nullable();
            $table->string('meta_test_event_code', 50)->nullable();
            $table->string('ga4_measurement_id', 50)->nullable();
            $table->text('encrypted_ga4_api_secret')->nullable();
            $table->boolean('enable_meta_capi')->default(false);
            $table->boolean('enable_ga4')->default(false);
            $table->boolean('default_consent_ad_storage')->default(true);
            $table->boolean('default_consent_analytics')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketing_configs');
        Schema::dropIfExists('order_attributions');
        Schema::dropIfExists('marketing_events');
    }
};

