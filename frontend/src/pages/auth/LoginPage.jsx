import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(form);
    setSubmitting(false);

    if (result.success) {
      const redirectTo = location.state?.from?.pathname;
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(result.user.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-brand">
          <div className="auth-visual-mark">M+</div>
          <span className="auth-visual-brandname">MediCare</span>
        </div>
        <div className="auth-visual-quote">
          <h2>Healthcare, organized around you.</h2>
          <p>
            Sign in to manage your appointments, view medical records, track prescriptions, and stay on top of
            your care — all in one secure place.
          </p>
        </div>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">6+</div>
            <div className="auth-visual-stat-label">Departments</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">24/7</div>
            <div className="auth-visual-stat-label">Record Access</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to home
          </Link>

          <h1>Welcome back</h1>
          <p className="auth-form-subtitle">Log in to access your MediCare account.</p>

          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <div className="flex justify-between items-center mb-2">
              <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" block loading={submitting}>
              Log In
            </Button>
          </form>

          <p className="auth-form-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
