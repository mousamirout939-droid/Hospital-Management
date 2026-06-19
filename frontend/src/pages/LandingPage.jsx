import { Link } from 'react-router-dom';
import PublicNavbar from '../components/common/PublicNavbar';
import Button from '../components/common/Button';
import {
  IconCalendar,
  IconFile,
  IconPill,
  IconFlask,
  IconReceipt,
  IconShield,
  IconClock,
  IconArrowRight,
  IconCheck,
  IconStethoscope,
  IconHeart,
} from '../components/common/Icons';

const departments = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'General Medicine',
];

const features = [
  {
    icon: IconCalendar,
    title: 'Effortless Booking',
    desc: 'Find the right specialist and book a time slot that works for you, in under a minute.',
  },
  {
    icon: IconFile,
    title: 'Medical Records, Centralized',
    desc: 'Every diagnosis, visit, and vital sign in one secure timeline you and your doctor can trust.',
  },
  {
    icon: IconPill,
    title: 'Digital Prescriptions',
    desc: 'Prescriptions issued straight to your portal — dosage, duration, and instructions, always on hand.',
  },
  {
    icon: IconFlask,
    title: 'Lab Results Online',
    desc: 'Get notified the moment your lab results are ready, with clear flags on out-of-range values.',
  },
  {
    icon: IconReceipt,
    title: 'Transparent Billing',
    desc: 'Itemized invoices and a clear payment history — no surprise charges, ever.',
  },
  {
    icon: IconShield,
    title: 'Private & Secure',
    desc: 'Your health data is encrypted and only ever visible to you and your care team.',
  },
];

const steps = [
  {
    title: 'Create your account',
    desc: 'Sign up in moments with just your name, email, and a few basic health details.',
  },
  {
    title: 'Book an appointment',
    desc: 'Browse doctors by department, check real-time availability, and reserve your slot.',
  },
  {
    title: 'Get care, stay informed',
    desc: 'Receive prescriptions, lab results, and invoices the moment they’re ready — all in one place.',
  },
];

const LandingPage = () => {
  return (
    <div>
      <PublicNavbar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="container landing-hero-inner">
          <div>
            <span className="landing-eyebrow">Hospital Management, Simplified</span>
            <h1>
              Healthcare that fits <span className="highlight">around your life</span>, not the other way around.
            </h1>
            <p className="landing-hero-sub">
              Book appointments, track prescriptions, view lab results, and manage billing — all from one calm,
              uncluttered patient portal.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Book Your First Visit <IconArrowRight width={16} height={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Patient Login
                </Button>
              </Link>
            </div>
            <div className="landing-hero-trust">
              <div>
                <div className="landing-trust-num">6+</div>
                <div className="landing-trust-label">Specialist Departments</div>
              </div>
              <div>
                <div className="landing-trust-num">24/7</div>
                <div className="landing-trust-label">Online Record Access</div>
              </div>
              <div>
                <div className="landing-trust-num">100%</div>
                <div className="landing-trust-label">Digital & Paperless</div>
              </div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="admit-card-float-1">
              <IconCheck width={16} height={16} style={{ color: 'var(--color-success)' }} />
              Appointment confirmed
            </div>
            <div className="admit-card">
              <div className="admit-card-top">
                <div>
                  <div className="admit-card-hospital">MediCare Hospital</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-body)' }}>
                    Appointment Pass
                  </div>
                </div>
                <div className="admit-card-id">
                  ID #A-2026-0619
                </div>
              </div>
              <div className="admit-card-divider" />
              <div className="admit-card-row">
                <span className="label">Patient</span>
                <span className="value">Riya Sharma</span>
              </div>
              <div className="admit-card-row">
                <span className="label">Doctor</span>
                <span className="value">Dr. Sarah Johnson</span>
              </div>
              <div className="admit-card-row">
                <span className="label">Department</span>
                <span className="value">Cardiology</span>
              </div>
              <div className="admit-card-row">
                <span className="label">Date</span>
                <span className="value">Jun 22, 2026</span>
              </div>
              <div className="admit-card-row">
                <span className="label">Time</span>
                <span className="value">10:00 - 10:30</span>
              </div>
              <span className="admit-card-status">
                <IconCheck width={12} height={12} /> Confirmed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="landing-section landing-section-alt">
        <div className="container">
          <div className="landing-section-header">
            <h2>Specialist Care, All Under One Roof</h2>
            <p>Our doctors span the departments you need most, with more added regularly.</p>
          </div>
          <div className="dept-grid">
            {departments.map((dept) => (
              <div key={dept} className="dept-chip">
                {dept}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <h2>Everything You Need, Nothing You Don't</h2>
            <p>A complete patient experience — from booking to billing — built around clarity and trust.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon width={22} height={22} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-section-alt">
        <div className="container">
          <div className="landing-section-header">
            <h2>Getting Care Takes Three Steps</h2>
            <p>No phone queues, no paperwork — just a few clicks between you and the right doctor.</p>
          </div>
          <div className="steps-row">
            {steps.map((step, i) => (
              <div key={step.title} className="step-item">
                <div className="step-marker">0{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-section">
        <div className="container">
          <div className="cta-banner">
            <IconHeart width={32} height={32} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
            <h2>Your care, organized. Starting today.</h2>
            <p>Join MediCare and take the first step toward simpler, more transparent healthcare.</p>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer container">
        <span>© 2026 MediCare Hospital Management System. All rights reserved.</span>
        <span className="flex items-center gap-2">
          <IconStethoscope width={16} height={16} /> Built for better care.
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;
