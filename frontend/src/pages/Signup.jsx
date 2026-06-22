import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Bug, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { registerUser } from '../services/auth';

const Signup = () => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);
  try {
    const res = await registerUser(name, email, password);
    setSuccess(res.data.message);
    setName('');
    setEmail('');
    setPassword('');
  } catch (err) {
    setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
      <div className="container-fluid" style={{ minHeight: 'calc(100vh - 45px)' }}>
        <div className="row" style={{ minHeight: 'calc(100vh - 45px)' }}>

          {/* Left — info panel */}
          <div
            className="col-lg-6 d-none d-lg-flex flex-column justify-content-center px-5"
            style={{ borderRight: '1px solid var(--border-color)' }}
          >
            <div style={{ maxWidth: '460px' }}>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>
                Start debugging smarter
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
                Create a free account and get access to AI-powered bug diagnosis, automatic failing test case generation, and a built-in chat assistant for your competitive programming problems.
              </p>
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.7' }}>
                  ✅ Free to use<br />
                  ✅ Supports C++, Python, Java, JavaScript<br />
                  ✅ Saves your debug history<br />
                  ✅ AI chat for every debug session
                </p>
              </div>
            </div>
          </div>

          {/* Right — signup form */}
          <div className="col-12 col-lg-6 d-flex flex-column justify-content-center align-items-center px-3 px-md-5">
            <div style={{ width: '100%', maxWidth: '380px' }}>
              <h5 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Create account</h5>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Sign up to start debugging</p>

              {error && (
                <div className="mb-3 px-3 py-2" style={{
                  backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--danger)',
                  borderRadius: '4px', color: 'var(--danger)', fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-3 px-3 py-2" style={{
                  backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--success)',
                  borderRadius: '4px', color: 'var(--success)', fontSize: '13px'
                }}>
                  {success}
                </div>
              )}

              {/* Google */}
              <button
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{
                  padding: '8px', fontSize: '13px', fontWeight: 500,
                  backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="d-flex align-items-center mb-3">
                <hr style={{ flex: 1, borderColor: 'var(--border-color)' }} />
                <span style={{ padding: '0 10px', fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
                <hr style={{ flex: 1, borderColor: 'var(--border-color)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: '13px',
                      backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: '13px',
                      backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Password
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
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            {/* Info — shown only on mobile below the form */}
<div className="d-lg-none mt-4" style={{
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '4px',
  border: '1px solid var(--border-color)',
}}>
  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.7' }}>
    ✅ Free to use<br />
    ✅ Supports C++, Python, Java, JavaScript<br />
    ✅ Saves your debug history<br />
    ✅ AI chat for every debug session
  </p>
</div>
              <div className="mt-3 text-center">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;