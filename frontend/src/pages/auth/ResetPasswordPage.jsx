import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { extractErrorMessage } from '../../services/api';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.resetPassword(token, { password: form.password });
      localStorage.setItem('hms_token', res.data.token);
      localStorage.setItem('hms_user', JSON.stringify(res.data.user));
      setSuccess(true);
      setTimeout(() => {
        navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard');
      }, 1500);
    } catch (err) {
      setError(extractErrorMessage(err));
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
          <h2>Almost there.</h2>
          <p>Choose a new password to secure your account and get back to managing your care.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to login
          </Link>

          <h1>Set a new password</h1>
          <p className="auth-form-subtitle">Make sure it's at least 6 characters.</p>

          {error && <Alert type="danger">{error}</Alert>}
          {success && <Alert type="success">Password reset successfully. Redirecting you now…</Alert>}

          {!success && (
            <form onSubmit={handleSubmit}>
              <FormField
                label="New password"
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                required
              />
              <FormField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                required
              />
              <Button type="submit" variant="primary" block loading={submitting}>
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
