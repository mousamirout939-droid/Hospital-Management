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
  specialization: '',
  department: '',
  qualification: '',
  experienceYears: '',
  consultationFee: '',
  bio: '',
};

const DoctorRegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

    if (!form.specialization || !form.department || !form.consultationFee) {
      setError('Please complete your specialization, department, and consultation fee.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      specialization: form.specialization,
      department: form.department,
      qualification: form.qualification,
      experienceYears: Number(form.experienceYears || 0),
      consultationFee: Number(form.consultationFee),
      bio: form.bio,
      role: 'doctor',
    };

    const result = await register(payload);
    setSubmitting(false);

    if (result.success) {
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
          <h2>Join the care team.</h2>
          <p>
            Create your doctor account to manage appointments, records, and prescriptions for your patients in one simple dashboard.
          </p>
        </div>
        <div className="auth-visual-stats">
          <div>
            <div className="auth-visual-stat-num">6+</div>
            <div className="auth-visual-stat-label">Departments</div>
          </div>
          <div>
            <div className="auth-visual-stat-num">₹</div>
            <div className="auth-visual-stat-label">Fees setup</div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box" style={{ maxWidth: 780 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--color-ink-soft)', fontSize: '0.85rem' }}>
            <IconStethoscope width={16} height={16} /> Back to home
          </Link>

          <h1>Doctor Registration</h1>
          <p className="auth-form-subtitle">Set up your specialist profile and start seeing patients.</p>

          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <FormField label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Dr. Ananya Patel" required autoComplete="name" />
              <FormField label="Email address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@medicare.com" required autoComplete="email" />
            </div>

            <div className="field-row">
              <FormField label="Phone number" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" autoComplete="tel" />
              <FormField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} placeholder="Cardiologist" required />
            </div>

            <div className="field-row">
              <FormField label="Department" name="department" value={form.department} onChange={handleChange} placeholder="Cardiology" required />
              <FormField label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} placeholder="MD, DM" />
            </div>

            <div className="field-row">
              <FormField label="Experience (years)" name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={handleChange} placeholder="8" />
              <FormField label="Consultation fee (₹)" name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={handleChange} placeholder="800" required />
            </div>

            <FormField
              label="Short bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Briefly describe your expertise and care philosophy"
            />

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
              Create Doctor Account
            </Button>
          </form>

          <p className="auth-form-footer">
            Already a doctor? <Link to="/doctor/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegisterPage;
