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
        // 1. AI Configuration (Per-Tenant or Standalone)
        Schema::create('ai_configs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50)->default('local'); // local, gemini, openai
            $table->text('encrypted_api_key')->nullable();
            $table->string('model_name', 100)->nullable();
            $table->text('system_prompt')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('enable_shopping_assistant')->default(true);
            $table->boolean('enable_business_assistant')->default(true);
            $table->timestamps();
        });

        // 2. AI Conversations
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('channel', 30)->default('storefront'); // storefront, backoffice
            $table->timestamps();
        });

        // 3. AI Messages
        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->enum('sender', ['user', 'assistant']);
            $table->text('message_text');
            $table->string('intent', 50)->nullable();
            $table->json('structured_payload')->nullable(); // product cards, tracking info, KPI metrics
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_configs');
    }
};

