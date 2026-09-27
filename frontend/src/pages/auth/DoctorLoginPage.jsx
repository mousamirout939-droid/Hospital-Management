import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const DoctorLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      if (result.user.role !== 'doctor') {
        setError('This doctor portal is for doctor accounts only. Please use the patient login page.');
        return;
      }

      navigate('/doctor/dashboard');
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
          <h2>Doctor portal access.</h2>
          <p>
            Manage appointments, review records, update prescriptions, and keep your patient care flow organized from one secure dashboard.
          </p>
        </div>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">24/7</div>
            <div className="auth-visual-stat-label">Availability</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">Fast</div>
            <div className="auth-visual-stat-label">Case updates</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to home
          </Link>

          <h1>Doctor Login</h1>
          <p className="auth-form-subtitle">Sign in to your MediCare doctor account.</p>

          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="doctor@medicare.com"
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
            New doctor? <Link to="/doctor/register">Create account</Link>
          </p>
          <p className="auth-form-footer">
            Need patient access? <Link to="/login">Patient login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
