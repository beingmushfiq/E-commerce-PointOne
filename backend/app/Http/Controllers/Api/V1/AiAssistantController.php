<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Ai\AiAssistantManager;
use App\Http\Controllers\Controller;
use App\Models\Ai\AiConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        protected AiAssistantManager $aiManager
    ) {}

    /**
     * Customer-facing Shopping Assistant Chat (Local-First, Bilingual Bangla/English).
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'    => 'required|string|max:1000',
            'session_id' => 'required|string|max:100',
        ]);

        $result = $this->aiManager->chat(
            prompt: $validated['message'],
            sessionId: $validated['session_id'],
            channel: 'storefront',
            userId: $request->user()?->id
        );

        return response()->json([
            'status' => 'success',
            'data'   => $result,
        ]);
    }

    /**
     * Tenant Staff-facing Business Intelligence Assistant.
     */
    public function businessQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query'      => 'required|string|max:1000',
            'session_id' => 'nullable|string|max:100',
        ]);

        $sessionId = $validated['session_id'] ?? ('staff-bi-' . ($request->user()?->id ?? 'guest'));

        $result = $this->aiManager->chat(
            prompt: $validated['query'],
            sessionId: $sessionId,
            channel: 'backoffice',
            userId: $request->user()?->id
        );

        return response()->json([
            'status' => 'success',
            'data'   => $result,
        ]);
    }

    /**
     * Get AI Configuration.
     */
    public function config(): JsonResponse
    {
        $config = AiConfig::firstOrCreate(
            ['id' => 1],
            [
                'provider'                  => 'local',
                'is_active'                 => true,
                'enable_shopping_assistant' => true,
                'enable_business_assistant' => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'data'   => [
                'provider'                  => $config->provider,
                'model_name'                => $config->model_name,
                'has_api_key'               => !empty($config->encrypted_api_key),
                'is_active'                 => $config->is_active,
                'enable_shopping_assistant' => $config->enable_shopping_assistant,
                'enable_business_assistant' => $config->enable_business_assistant,
            ],
        ]);
    }

    /**
     * Update AI Configuration (Encrypted at rest).
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider'                  => 'required|in:local,gemini,openai',
            'api_key'                   => 'nullable|string',
            'model_name'                => 'nullable|string|max:100',
            'is_active'                 => 'boolean',
            'enable_shopping_assistant' => 'boolean',
            'enable_business_assistant' => 'boolean',
        ]);

        $config = AiConfig::firstOrCreate(
            ['id' => 1],
            [
                'provider'                  => 'local',
                'is_active'                 => true,
                'enable_shopping_assistant' => true,
                'enable_business_assistant' => true,
            ]
        );

        $data = [
            'provider'                  => $validated['provider'],
            'model_name'                => $validated['model_name'] ?? $config->model_name,
            'is_active'                 => $validated['is_active'] ?? ($config->is_active ?? true),
            'enable_shopping_assistant' => $validated['enable_shopping_assistant'] ?? ($config->enable_shopping_assistant ?? true),
            'enable_business_assistant' => $validated['enable_business_assistant'] ?? ($config->enable_business_assistant ?? true),
        ];

        if (!empty($validated['api_key'])) {
            $data['encrypted_api_key'] = $validated['api_key'];
        }

        $config->update($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'AI settings updated successfully',
            'data'    => [
                'provider'    => $config->provider,
                'model_name'  => $config->model_name,
                'has_api_key' => !empty($config->encrypted_api_key),
                'is_active'   => $config->is_active,
            ],
        ]);
    }
}
