import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center">
        <h1 style={{ fontSize: '72px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>404</h1>
        <h5 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Page not found</h5>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none', padding: '8px 24px' }}>
          Go home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;