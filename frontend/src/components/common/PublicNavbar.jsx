import { Link } from 'react-router-dom';
import Button from '../common/Button';

const PublicNavbar = () => (
  <header className="landing-header">
    <div className="container landing-header-inner">
      <Link to="/" className="landing-brand" style={{ textDecoration: 'none' }}>
        <div className="landing-brand-mark">M+</div>
        <span className="landing-brand-name">MediCare</span>
      </Link>
      <nav className="landing-nav-actions">
        <Link to="/login">
          <Button variant="ghost">Log In</Button>
        </Link>
        <Link to="/register">
          <Button variant="primary">Get Started</Button>
        </Link>
      </nav>
    </div>
  </header>
);

export default PublicNavbar;
