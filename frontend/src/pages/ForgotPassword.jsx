import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ForgotPassword = () => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    // API call will be added later
    console.log('Forgot password:', { email });
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Link to="/" className="cf-navbar-brand">Debug App</Link>
        <button className="cf-btn cf-btn-secondary" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </div>

      {/* Form */}
      <div className="container" style={{ maxWidth: '420px', paddingTop: '60px' }}>
        <div className="cf-card">
          <h5 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 600 }}>
            Forgot password
          </h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Enter your email and we'll send you an OTP to reset your password.
          </p>

          {error && (
            <div className="alert alert-danger py-2 px-3" style={{ fontSize: '13px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2 px-3" style={{ fontSize: '13px' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Email
              </label>
              <input
                type="email"
                className="cf-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="cf-btn cf-btn-primary w-100"
              disabled={loading}
              style={{ padding: '8px' }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link to="/login" style={{ fontSize: '13px', color: 'var(--accent)' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;