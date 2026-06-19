import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen message="Loading…" />;

  if (isAuthenticated) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
