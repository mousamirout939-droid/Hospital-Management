import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import { getDashboardPath } from '../utils/rolePaths';

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen message="Loading…" />;

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
