<?php

namespace App\Http\Middleware;

use App\Edition\EditionManager;
use App\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        protected TenantManager $tenantManager,
        protected EditionManager $editionManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Skip resolution if running in Standalone Edition
        if ($this->editionManager->isStandalone()) {
            return $next($request);
        }

        $host = $request->getHost();
        $exemptDomains = config('centerpoint.tenancy.exempt_domains', []);

        // 2. Allow central platform domains without tenant resolution
        if (in_array(strtolower($host), array_map('strtolower', $exemptDomains), true)) {
            return $next($request);
        }

        // 3. Resolve tenant from trusted domain record
        $context = $this->tenantManager->resolveFromHostname($host);

        if (!$context) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tenant domain is not recognized, unverified, or inactive.',
            ], 404);
        }

        return $next($request);
    }
}

