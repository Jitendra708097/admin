/**
 * @module ProtectedRoute
 * @description Protected route that redirects to login if not authenticated.
 */
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute() {
  const { isAuthenticated, canAccessAdminPortal } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return canAccessAdminPortal ? <Outlet /> : <Navigate to="/login" replace />;
}
