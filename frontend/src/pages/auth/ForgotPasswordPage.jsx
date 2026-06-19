import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { extractErrorMessage } from '../../services/api';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { IconStethoscope } from '../../components/common/Icons';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      setSubmitted(true);
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
          <h2>Let's get you back in.</h2>
          <p>Enter the email associated with your account and we'll send you a secure link to reset your password.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to login
          </Link>

          <h1>Reset your password</h1>
          <p className="auth-form-subtitle">We'll email you a link to reset it.</p>

          {error && <Alert type="danger">{error}</Alert>}

          {submitted ? (
            <Alert type="success">
              If an account exists for {email}, you'll receive a password reset link shortly. Be sure to check your
              spam folder.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <FormField
                label="Email address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <Button type="submit" variant="primary" block loading={submitting}>
                Send Reset Link
              </Button>
            </form>
          )}

          <p className="auth-form-footer">
            Remembered your password? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
