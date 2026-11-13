<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Edition\EditionManager;
use App\Http\Controllers\Controller;
use App\Models\Central\PlatformAdmin;
use App\Models\StorefrontSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StorefrontCustomizerController extends Controller
{
    public function __construct(
        protected EditionManager $editionManager
    ) {}

    /**
     * Public endpoint to deliver active storefront configuration,
     * theme tokens, motion style, currency rates, and branding.
     */
    public function publicConfig(): JsonResponse
    {
        $config = StorefrontSetting::getPublicConfig();

        return response()->json([
            'status' => 'success',
            'data'   => $config,
        ]);
    }

    /**
     * Superadmin login for the secret /mcp-login portal.
     */
    public function mcpLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = null;
        $isSuperAdmin = false;

        // 1. In SaaS mode, check PlatformAdmin
        if ($this->editionManager->isMultiTenant()) {
            $admin = PlatformAdmin::where('email', $request->email)->first();
            if ($admin && Hash::check($request->password, $admin->password)) {
                $user = $admin;
                $isSuperAdmin = (bool) $admin->is_super_admin;
            }
        }

        // 2. Fallback to Standalone User with admin privileges
        if (!$user) {
            $localUser = User::where('email', $request->email)->first();
            if ($localUser && Hash::check($request->password, $localUser->password)) {
                $user = $localUser;
                $isSuperAdmin = true;
            }
        }

        if (!$user || !$isSuperAdmin) {
            throw ValidationException::withMessages([
                'email' => ['Invalid Master Control Panel credentials or unauthorized access.'],
            ]);
        }

        $token = $user->createToken('mcp_superadmin_token', ['platform:manage', 'theme:customize'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Superadmin authentication successful.',
            'data' => [
                'token' => $token,
                'user'  => [
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'super_admin',
                ],
            ],
        ]);
    }

    /**
     * Retrieve all settings (including metadata) for Master Control Panel.
     */
    public function getMasterSettings(): JsonResponse
    {
        $settings = StorefrontSetting::getMasterConfig();

        return response()->json([
            'status' => 'success',
            'data'   => $settings,
        ]);
    }

    /**
     * Update settings from Master Control Panel.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        if (StorefrontSetting::count() === 0) {
            StorefrontSetting::seedDefaults();
        }

        $payload = $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'nullable',
        ]);

        foreach ($payload['settings'] as $item) {
            $setting = StorefrontSetting::firstOrNew(['key' => $item['key']]);
            if ($setting->exists) {
                // Skip if secret value wasn't changed (still masked)
                if ($setting->is_secret && $item['value'] === '••••••••') {
                    continue;
                }
                $setting->setParsedValue($item['value']);
                $setting->save();
            } else {
                $setting->group = 'custom';
                $setting->type = is_array($item['value']) ? 'json' : (is_bool($item['value']) ? 'boolean' : 'string');
                $setting->setParsedValue($item['value']);
                $setting->save();
            }
        }

        StorefrontSetting::flushCache();

        return response()->json([
            'status'  => 'success',
            'message' => 'Storefront and platform settings updated successfully.',
            'data'    => StorefrontSetting::getPublicConfig(),
        ]);
    }

    /**
     * Restore all settings to factory vetted defaults.
     */
    public function resetToDefaults(): JsonResponse
    {
        StorefrontSetting::seedDefaults();

        return response()->json([
            'status'  => 'success',
            'message' => 'All settings have been restored to factory vetted defaults.',
            'data'    => StorefrontSetting::getPublicConfig(),
        ]);
    }
}
