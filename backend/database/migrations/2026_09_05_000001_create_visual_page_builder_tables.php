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
        // 1. Add Section-Based Builder Columns to Pages Table
        Schema::table('pages', function (Blueprint $table) {
            $table->json('sections')->nullable()->after('content');
            $table->text('custom_css')->nullable()->after('sections');
            $table->text('custom_js')->nullable()->after('custom_css');
            $table->unsignedInteger('version')->default(1)->after('custom_js');
            $table->boolean('is_system')->default(false)->after('version');
        });

        // 2. Page Version History for Rollbacks & Auditing
        Schema::create('page_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->json('sections')->nullable();
            $table->text('custom_css')->nullable();
            $table->text('custom_js')->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['page_id', 'version_number']);
        });

        // 3. Theme Design Tokens & Presets
        Schema::create('theme_configs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(false);
            $table->json('tokens'); // typography, colors, border_radius, shadows, spacing
            $table->text('custom_css')->nullable();
            $table->timestamps();
        });

        // 4. Sandboxed Storefront Embeds (SEC-04: Isolated custom scripts)
        Schema::create('storefront_embeds', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sandbox_token', 64)->unique();
            $table->longText('html_code')->nullable();
            $table->text('css_code')->nullable();
            $table->text('js_code')->nullable();
            $table->boolean('is_sandboxed')->default(true);
            $table->boolean('is_published')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['sandbox_token', 'is_published']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_embeds');
        Schema::dropIfExists('theme_configs');
        Schema::dropIfExists('page_versions');

        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['sections', 'custom_css', 'custom_js', 'version', 'is_system']);
        });
    }
};

