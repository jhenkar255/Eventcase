import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './ui';

interface Props {
  roles?: string[];
}

export const ProtectedRoute = ({ roles }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner full label="Checking session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'vendor' ? '/vendor' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
};
