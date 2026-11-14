import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthGuard } from '../contexts/AuthContext';
import { PermissionDenied } from '../components/DesignSystem';

interface ProtectedRouteProps {
  children: React.ReactNode;
  guard: AuthGuard;
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  guard,
  requiredPermission,
  requiredRole,
}) => {
  const { token, platformToken, isLoading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
            Verifying Authorization...
          </span>
        </div>
      </div>
    );
  }

  // 1. Platform Operator Guard
  if (guard === 'platform') {
    const hasPlatformAccess = Boolean(platformToken || localStorage.getItem('mcp_token'));
    if (!hasPlatformAccess) {
      return <Navigate to="/platform/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // 2. Tenant Store Staff Guard
  if (guard === 'staff') {
    const hasStaffToken = Boolean(token || localStorage.getItem('token'));
    if (!hasStaffToken) {
      return <Navigate to="/studio/login" state={{ from: location }} replace />;
    }

    if (requiredRole && !hasRole(requiredRole) && !hasRole('admin')) {
      return (
        <PermissionDenied
          requiredRole={requiredRole}
          description="Your assigned role does not grant permission to access this module. Please contact your store administrator."
        />
      );
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <PermissionDenied
          requiredRole={`Permission: ${requiredPermission}`}
          description="Action forbidden by store RBAC policy."
        />
      );
    }

    return <>{children}</>;
  }

  // 3. Customer Guard
  if (guard === 'customer' && !token) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
