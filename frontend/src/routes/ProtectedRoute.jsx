import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
    const currentRole = user.role || 'user';
    const allowedRoleLabel = allowedRoles.join(' or ');

    return (
      <div className="auth-page">
        <div className="auth-form-side" style={{ width: '100%', maxWidth: 560, margin: '80px auto' }}>
          <div className="auth-form-box" style={{ padding: 32 }}>
            <h1>Access denied</h1>
            <p className="auth-form-subtitle" style={{ marginBottom: 20 }}>
              You are signed in as a {currentRole}, but this page is only for {allowedRoleLabel} users.
            </p>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <Link to={redirectPath} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Go to my dashboard
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
