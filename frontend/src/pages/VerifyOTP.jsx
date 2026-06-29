import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bug, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { verifyOTPUser } from '../services/auth';

const VerifyOTP = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user lands here without email in state, send back to forgot password
  if (!email) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>Invalid access. Please start from forgot password.</p>
          <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '13px' }}>Go to Forgot Password</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyOTPUser(email, otp);
      navigate('/reset-password', { state: { email, resetToken: res.data.resetToken } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>

      {/* Topbar */}
      <div
        className="d-flex justify-content-between align-items-center px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--navbar-bg)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bug size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Debug</span>
          </Link>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '1px 6px',
            border: '1px solid var(--border-color)', borderRadius: '3px',
            color: 'var(--text-muted)', letterSpacing: '0.5px'
          }}>BETA</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/about" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>About</Link>
          <button
            onClick={toggleTheme}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ minHeight: 'calc(100vh - 45px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Enter OTP</h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            We sent a 6-digit OTP to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Enter it below.
          </p>

          {error && (
            <div className="mb-3 px-3 py-2" style={{
              backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--danger)',
              borderRadius: '4px', color: 'var(--danger)', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                style={{
                  width: '100%', padding: '7px 10px', fontSize: '13px',
                  backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none',
                  letterSpacing: '4px', textAlign: 'center'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-100"
              style={{
                padding: '9px', fontSize: '13px', fontWeight: 600,
                backgroundColor: 'var(--accent)', color: '#ffffff',
                border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Didn't receive OTP?{' '}
              <Link to="/forgot-password" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Resend</Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;