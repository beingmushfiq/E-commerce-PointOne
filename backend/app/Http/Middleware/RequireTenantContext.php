<?php

namespace App\Http\Middleware;

use App\Edition\EditionManager;
use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireTenantContext
{
    public function __construct(
        protected TenantManager $tenantManager,
        protected EditionManager $editionManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Standalone mode always has default context
        if ($this->editionManager->isStandalone()) {
            return $next($request);
        }

        if (!$this->tenantManager->hasTenant()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Operation requires an initialized tenant context.',
            ], 403);
        }

        return $next($request);
    }
}

