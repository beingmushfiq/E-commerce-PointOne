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
        Schema::create('storefront_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group')->index(); // 'theme', 'motion', 'currency', 'sections', 'header', 'footer', 'integrations', 'branding'
            $table->longText('value')->nullable();
            $table->string('type', 32)->default('string'); // 'string', 'boolean', 'json', 'integer', 'float'
            $table->boolean('is_secret')->default(false); // If true, stored encrypted & masked in public API
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_settings');
    }
};

