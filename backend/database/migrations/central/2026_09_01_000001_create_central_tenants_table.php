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
        // 1. Tenants Registry
        Schema::connection('central')->create('tenants', function (Blueprint $table) {
            $table->string('id', 36)->primary(); // UUID/ULID
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('status', ['pending', 'active', 'suspended', 'archived'])->default('pending');
            $table->enum('edition', ['saas', 'enterprise'])->default('saas');
            $table->json('data')->nullable(); // Metadata, feature overrides
            $table->timestamps();
        });

        // 2. Tenant Domains & Host Routing
        Schema::connection('central')->create('tenant_domains', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36);
            $table->string('domain')->unique();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['domain', 'is_verified']);
        });

        // 3. Tenant Database Connection Credentials
        Schema::connection('central')->create('tenant_database_configs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 36)->unique();
            $table->string('driver', 32)->default('mysql');
            $table->string('host')->default('127.0.0.1');
            $table->integer('port')->default(3306);
            $table->string('database_name');
            $table->string('username');
            $table->text('encrypted_password');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('central')->dropIfExists('tenant_database_configs');
        Schema::connection('central')->dropIfExists('tenant_domains');
        Schema::connection('central')->dropIfExists('tenants');
    }
};

