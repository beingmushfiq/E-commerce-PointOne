<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Central\Plan;
use App\Models\Central\PlatformAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanManagementController extends Controller
{
    /**
     * List all SaaS subscription plans.
     */
    public function index(): JsonResponse
    {
        $plans = Plan::withCount(['subscriptions' => function ($q) {
            $q->whereIn('status', ['active', 'trialing']);
        }])->orderBy('price')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $plans,
        ]);
    }

    /**
     * Create a new subscription tier.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'slug'           => 'required|string|max:100|unique:central.plans,slug',
            'price'          => 'required|numeric|min:0',
            'billing_period' => 'required|in:monthly,yearly',
            'features_json'  => 'nullable|array',
            'limits_json'    => 'nullable|array',
            'is_active'      => 'boolean',
        ]);

        $plan = Plan::create($validated);

        $adminId = ($request->user() instanceof \App\Models\Central\PlatformAdmin) ? $request->user()->id : null;

        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'action'            => 'plan.created',
            'target_resource'   => "plan:{$plan->slug}",
            'payload'           => $validated,
            'ip_address'        => $request->ip(),
            'user_agent'        => $request->userAgent(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Subscription plan created successfully',
            'data'    => $plan,
        ], 201);
    }

    /**
     * Update an existing plan's pricing, features, or active status.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'price'          => 'sometimes|numeric|min:0',
            'billing_period' => 'sometimes|in:monthly,yearly',
            'features_json'  => 'nullable|array',
            'limits_json'    => 'nullable|array',
            'is_active'      => 'boolean',
        ]);

        $plan->update($validated);

        $adminId = ($request->user() instanceof \App\Models\Central\PlatformAdmin) ? $request->user()->id : null;

        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'action'            => 'plan.updated',
            'target_resource'   => "plan:{$plan->slug}",
            'payload'           => $validated,
            'ip_address'        => $request->ip(),
            'user_agent'        => $request->userAgent(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Subscription plan updated successfully',
            'data'    => $plan->fresh(),
        ]);
    }
}
