import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Bug, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { resetPasswordUser } from '../services/auth';

const ResetPassword = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user lands here without email or resetToken, send back
  if (!email || !resetToken) {
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

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await resetPasswordUser(email, password, resetToken);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
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
          <Bug size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Debug</span>
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

          <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Reset password</h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Enter a new password for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
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
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  style={{
                    width: '100%', padding: '7px 36px 7px 10px', fontSize: '13px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  style={{
                    width: '100%', padding: '7px 36px 7px 10px', fontSize: '13px',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                  }}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;