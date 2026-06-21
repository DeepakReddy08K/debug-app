import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const VerifyOTP = () => {
  const { theme, toggleTheme } = useTheme();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Email passed from ForgotPassword page via navigation state
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // API call will be added later
    console.log('Verify OTP:', { email, otp });
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
            Enter OTP
          </h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            We sent a 6-digit OTP to <strong>{email || 'your email'}</strong>. Enter it below.
          </p>

          {error && (
            <div className="alert alert-danger py-2 px-3" style={{ fontSize: '13px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                OTP Code
              </label>
              <input
                type="text"
                className="cf-input"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }}
              />
            </div>

            <button
              type="submit"
              className="cf-btn cf-btn-primary w-100"
              disabled={loading}
              style={{ padding: '8px' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-3 d-flex justify-content-between">
            <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent)' }}>
              Resend OTP
            </Link>
            <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;