import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingState } from '@/components/ui/QueryState';
import { useAuth } from './authContext';

/**
 * Sends first-time visitors to the welcome screen. Signed-in students and
 * guests pass straight through.
 */
export function RequireEntry() {
  const { hasEntered, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState />;
  if (!hasEntered) return <Navigate to="/welcome" replace state={{ from: location }} />;
  return <Outlet />;
}
