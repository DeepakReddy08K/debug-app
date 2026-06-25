import { Link } from 'react-router-dom';
import { Bug } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <Bug size={32} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
      <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>404 — Page not found</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" style={{
        fontSize: '13px', fontWeight: 600, padding: '7px 16px',
        backgroundColor: 'var(--accent)', color: '#ffffff',
        borderRadius: '4px', textDecoration: 'none',
      }}>
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;