import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, User, LogOut, History, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <nav className="cf-navbar d-flex align-items-center justify-content-between">
      {/* Left — Brand */}
      <div className="d-flex align-items-center gap-3">
        <Link to="/" className="cf-navbar-brand">
          Debug App
        </Link>
        <Link to="/" className="cf-nav-link d-none d-md-block">
          <Home size={14} className="me-1" />
          Home
        </Link>
        <Link to="/history" className="cf-nav-link d-none d-md-block">
          <History size={14} className="me-1" />
          History
        </Link>
        <Link to="/about" className="cf-nav-link d-none d-md-block">
          About
        </Link>
      </div>

      {/* Right — Theme toggle + user */}
      <div className="d-flex align-items-center gap-2">
        {/* Theme toggle */}
        <button
          className="cf-btn cf-btn-secondary d-flex align-items-center"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* User dropdown */}
        <div className="dropdown">
          <button
            className="cf-btn cf-btn-secondary d-flex align-items-center gap-1"
            data-bs-toggle="dropdown"
          >
            <User size={14} />
            <span className="d-none d-md-inline" style={{ fontSize: '13px' }}>Account</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end" style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            fontSize: '13px'
          }}>
            <li>
              <button
                className="dropdown-item d-flex align-items-center gap-2"
                onClick={handleLogout}
                style={{ color: 'var(--text-primary)' }}
              >
                <LogOut size={13} />
                Logout
              </button>
            </li>
          </ul>
        </div>

        {/* Mobile hamburger — links */}
        <div className="dropdown d-md-none">
          <button className="cf-btn cf-btn-secondary" data-bs-toggle="dropdown">
            ☰
          </button>
          <ul className="dropdown-menu dropdown-menu-end" style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}>
            <li><Link to="/" className="dropdown-item" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Home</Link></li>
            <li><Link to="/history" className="dropdown-item" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>History</Link></li>
            <li><Link to="/about" className="dropdown-item" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>About</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;