<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // System Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event'); // e.g. product.created, order.updated, user.login
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        // Activity / System Health Snapshots
        Schema::create('system_health_checks', function (Blueprint $table) {
            $table->id();
            $table->string('service'); // e.g., database, redis, storage, mail
            $table->string('status'); // ok, warning, error
            $table->string('response_time_ms')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_health_checks');
        Schema::dropIfExists('audit_logs');
    }
};
