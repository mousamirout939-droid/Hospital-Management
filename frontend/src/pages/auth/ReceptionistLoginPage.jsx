import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const ReceptionistLoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await login(form);
      if (!result.success) {
        setError(result.message);
        return;
      }

      if (result.user.role !== 'receptionist') {
        await logout();
        setError('This portal is for receptionist accounts only. Please use the login page for your role.');
        return;
      }

      navigate('/receptionist/dashboard');
    } finally {
      setSubmitting(false);
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
          <h2>Welcome to your reception desk.</h2>
          <p>
            Review the patient, doctor, date, and time for each visit, manage today’s queue, and confirm
            appointments from one secure hospital workspace.
          </p>
        </div>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">One</div>
            <div className="auth-visual-stat-label">Patient queue</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">Secure</div>
            <div className="auth-visual-stat-label">Staff access</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to home
          </Link>

          <h1>Receptionist Login</h1>
          <p className="auth-form-subtitle">Sign in to manage appointments and patient check-in.</p>

          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="receptionist@medicare.com"
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
            Receptionist accounts are created by a hospital administrator.
          </p>
          <p className="auth-form-footer">
            Need patient access? <Link to="/login">Patient login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistLoginPage;
