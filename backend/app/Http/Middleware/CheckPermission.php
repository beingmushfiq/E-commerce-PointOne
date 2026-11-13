<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated.'], 401);
        }

        // Platform Admin super-access
        if ($user instanceof \App\Models\Central\PlatformAdmin) {
            return $next($request);
        }

        // Admin role bypasses granular permissions
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return $next($request);
        }

        if (method_exists($user, 'hasPermissionTo')) {
            foreach ($permissions as $permission) {
                if ($user->hasPermissionTo($permission)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'status'  => 'error',
            'message' => 'Forbidden. You do not have the required permissions to perform this action.',
        ], 403);
    }
}

