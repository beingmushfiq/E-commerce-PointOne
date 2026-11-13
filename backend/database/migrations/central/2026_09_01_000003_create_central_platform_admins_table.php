<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations on the central database.
     */
    public function up(): void
    {
        // 1. Platform Administrators (Master Control Panel)
        Schema::connection('central')->create('platform_admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('two_factor_secret')->nullable();
            $table->boolean('is_super_admin')->default(false);
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Platform Audit Logs
        Schema::connection('central')->create('platform_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_admin_id')->nullable()->constrained('platform_admins')->nullOnDelete();
            $table->string('tenant_id', 36)->nullable();
            $table->string('action'); // e.g. tenant.created, tenant.suspended, plan.updated
            $table->string('target_resource')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('central')->dropIfExists('platform_audit_logs');
        Schema::connection('central')->dropIfExists('platform_admins');
    }
};

