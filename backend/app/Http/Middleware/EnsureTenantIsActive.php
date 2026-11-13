<?php

namespace App\Http\Middleware;

use App\Edition\EditionManager;
use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public function __construct(
        protected TenantManager $tenantManager,
        protected EditionManager $editionManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->editionManager->isStandalone()) {
            return $next($request);
        }

        $tenant = $this->tenantManager->getTenant();

        if ($tenant && $tenant->status !== 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'This store is currently ' . $tenant->status . '. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}

