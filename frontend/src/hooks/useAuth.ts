import { useAuth as useAuthContext } from '../contexts/AuthContext';
export type { User } from '../types/auth';

export const useAuth = () => {
  const auth = useAuthContext();

  return {
    user: auth.user,
    token: auth.token,
    isLoading: auth.isLoading,
    isAdmin: auth.isAdmin,
    login: async (credentials: { email: string; password: string }) => {
      return auth.loginWithCredentials(credentials.email, credentials.password, 'staff');
    },
    logout: () => auth.logout('staff'),
    hasPermission: auth.hasPermission,
    hasRole: auth.hasRole,
    isStaff: auth.isStaff,
    isPlatformAdmin: auth.isPlatformAdmin,
    isCustomer: auth.isCustomer,
  };
};
