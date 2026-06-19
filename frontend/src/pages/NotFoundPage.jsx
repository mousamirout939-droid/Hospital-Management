import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage = () => (
  <div className="loading-screen" style={{ minHeight: '100vh' }}>
    <h1 style={{ fontSize: '4rem', color: 'var(--color-primary-soft)' }}>404</h1>
    <h3>Page not found</h3>
    <p style={{ marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/">
      <Button variant="primary">Go back home</Button>
    </Link>
  </div>
);

export default NotFoundPage;
