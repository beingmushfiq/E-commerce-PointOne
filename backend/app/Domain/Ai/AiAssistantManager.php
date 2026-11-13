<?php

namespace App\Domain\Ai;

use App\Domain\Ai\Adapters\LocalDeterministicAssistant;
use App\Domain\Ai\Contracts\LlmProviderContract;
use App\Models\Ai\AiConfig;
use App\Models\Ai\AiConversation;
use App\Models\Ai\AiMessage;
use Illuminate\Support\Facades\Log;

class AiAssistantManager
{
    /** @var array<string, LlmProviderContract> */
    protected array $providers = [];

    public function __construct(
        protected LocalDeterministicAssistant $localAssistant
    ) {
        $this->providers['local'] = $this->localAssistant;
    }

    public function registerProvider(string $name, LlmProviderContract $provider): void
    {
        $this->providers[strtolower($name)] = $provider;
    }

    /**
     * Process an incoming conversational turn, storing conversation history and returning structured AI responses.
     */
    public function chat(
        string $prompt,
        string $sessionId,
        string $channel = 'storefront',
        ?int $userId = null
    ): array {
        // 1. Find or create AI Conversation thread
        $conversation = AiConversation::firstOrCreate(
            ['session_id' => $sessionId, 'channel' => $channel],
            ['user_id' => $userId]
        );

        if ($userId && !$conversation->user_id) {
            $conversation->update(['user_id' => $userId]);
        }

        // 2. Persist User Message
        AiMessage::create([
            'conversation_id' => $conversation->id,
            'sender'          => 'user',
            'message_text'    => $prompt,
        ]);

        // 3. Resolve active AI Provider
        $config = AiConfig::where('is_active', true)->first();
        $providerKey = strtolower($config?->provider ?? 'local');

        $provider = $this->providers[$providerKey] ?? $this->localAssistant;

        try {
            $response = $provider->generateReply($prompt, [
                'channel' => $channel,
                'user_id' => $userId,
            ]);
        } catch (\Throwable $e) {
            Log::warning("AI Provider [{$providerKey}] failed, falling back to local assistant: " . $e->getMessage());
            $response = $this->localAssistant->generateReply($prompt, [
                'channel' => $channel,
                'user_id' => $userId,
            ]);
        }

        // 4. Persist Assistant Response
        $assistantMessage = AiMessage::create([
            'conversation_id'    => $conversation->id,
            'sender'             => 'assistant',
            'message_text'       => $response['reply_text'],
            'intent'             => $response['intent'],
            'structured_payload' => $response['structured_payload'] ?? null,
        ]);

        return [
            'reply'              => $response['reply_text'],
            'intent'             => $response['intent'],
            'structured_payload' => $response['structured_payload'] ?? null,
            'conversation_id'    => $conversation->id,
            'message_id'         => $assistantMessage->id,
        ];
    }
}

