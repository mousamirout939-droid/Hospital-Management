import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    return score;
  };
  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    const { confirmPassword, ...payload } = form;
    const result = await register(payload);
    setSubmitting(false);

    if (result.success) {
      navigate('/patient/dashboard');
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
          <h2>Your first step to better-managed care.</h2>
          <p>
            Create your account to book appointments with our specialists, and keep every medical record,
            prescription, and bill organized in one place.
          </p>
        </div>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">2 min</div>
            <div className="auth-visual-stat-label">To get set up</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">Free</div>
            <div className="auth-visual-stat-label">No cost to register</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to home
          </Link>

          <h1>Create your account</h1>
          <p className="auth-form-subtitle">Join MediCare to start booking appointments.</p>

          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Full name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              autoComplete="name"
            />
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

            <div className="field-row">
              <FormField
                label="Phone number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                autoComplete="tel"
              />
              <FormField
                label="Date of birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="field-row">
              <FormField
                label="Gender"
                name="gender"
                as="select"
                value={form.gender}
                onChange={handleChange}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <FormField
                label="Blood group"
                name="bloodGroup"
                as="select"
                value={form.bloodGroup}
                onChange={handleChange}
                options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => ({ value: bg, label: bg }))}
              />
            </div>

            <FormField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
            {form.password && (
              <div className="password-strength" style={{ marginTop: -10, marginBottom: 16 }}>
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className={`password-strength-bar ${
                      strength >= level ? (strength === 1 ? 'filled-weak' : strength === 2 ? 'filled-medium' : 'filled-strong') : ''
                    }`}
                  />
                ))}
              </div>
            )}

            <FormField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" block loading={submitting}>
              Create Account
            </Button>
          </form>

          <p className="auth-form-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
