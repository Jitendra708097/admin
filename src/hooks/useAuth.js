/**
 * @module useAuth
 * @description Custom hook for auth state and role checks.
 */
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.auth);
  const role = auth.user?.role;
  const canAccessAdminPortal = ['admin', 'manager', 'superadmin'].includes(role);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    orgInfo: auth.orgInfo,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isSuperadmin: role === 'superadmin',
    canAccessAdminPortal,
    org: auth.orgInfo,
  };
};
