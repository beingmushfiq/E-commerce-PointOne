<?php

namespace App\Domain\Ai\Contracts;

interface LlmProviderContract
{
    /**
     * Provider identifier (e.g. 'local', 'gemini', 'openai').
     */
    public function getIdentifier(): string;

    /**
     * Generate an assistant response from the prompt and domain context.
     *
     * @return array{
     *     reply_text: string,
     *     intent: string,
     *     structured_payload?: array|null
     * }
     */
    public function generateReply(string $prompt, array $context = []): array;
}

