<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Central\PlatformAuditLog;
use App\Models\Central\Tenant;
use App\Tenancy\TenantProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantLifecycleController extends Controller
{
    /**
     * List all provisioned tenants with search, status filters, and subscription details.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with(['domains', 'databaseConfig', 'activeSubscription.plan'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $tenants = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data'   => $tenants,
        ]);
    }

    /**
     * Provision a new tenant and configure database, domain routing, and plan.
     */
    public function store(Request $request, TenantProvisioner $provisioner): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'slug'      => 'nullable|string|max:100',
            'domain'    => 'nullable|string|max:255',
            'plan_id'   => 'nullable|exists:central.plans,id',
            'edition'   => 'nullable|in:saas,standalone',
            'db_driver' => 'nullable|string',
        ]);

        $tenant = $provisioner->provision($validated);

        $adminId = ($request->user() instanceof \App\Models\Central\PlatformAdmin) ? $request->user()->id : null;

        // Record Platform Audit Log
        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'tenant_id'         => $tenant->id,
            'action'            => 'tenant.created',
            'target_resource'   => "tenant:{$tenant->slug}",
            'payload'           => [
                'name'    => $tenant->name,
                'slug'    => $tenant->slug,
                'edition' => $tenant->edition,
            ],
            'ip_address'        => $request->ip(),
            'user_agent'        => $request->userAgent(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Tenant [{$tenant->name}] provisioned successfully",
            'data'    => $tenant,
        ], 201);
    }

    /**
     * Get single tenant details.
     */
    public function show(string $id): JsonResponse
    {
        $tenant = Tenant::with(['domains', 'databaseConfig', 'subscriptions.plan', 'activeSubscription.plan'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $tenant,
        ]);
    }

    /**
     * Suspend a tenant, blocking storefront and backoffice operations.
     */
    public function suspend(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['status' => 'suspended']);

        $adminId = ($request->user() instanceof \App\Models\Central\PlatformAdmin) ? $request->user()->id : null;

        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'tenant_id'         => $tenant->id,
            'action'            => 'tenant.suspended',
            'target_resource'   => "tenant:{$tenant->slug}",
            'payload'           => ['previous_status' => 'active', 'new_status' => 'suspended'],
            'ip_address'        => $request->ip(),
            'user_agent'        => $request->userAgent(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Tenant [{$tenant->name}] suspended successfully",
            'data'    => $tenant->fresh(),
        ]);
    }

    /**
     * Reactivate a suspended tenant.
     */
    public function activate(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update(['status' => 'active']);

        $adminId = ($request->user() instanceof \App\Models\Central\PlatformAdmin) ? $request->user()->id : null;

        PlatformAuditLog::create([
            'platform_admin_id' => $adminId,
            'tenant_id'         => $tenant->id,
            'action'            => 'tenant.activated',
            'target_resource'   => "tenant:{$tenant->slug}",
            'payload'           => ['previous_status' => 'suspended', 'new_status' => 'active'],
            'ip_address'        => $request->ip(),
            'user_agent'        => $request->userAgent(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Tenant [{$tenant->name}] activated successfully",
            'data'    => $tenant->fresh(),
        ]);
    }
}
