import { Link } from 'react-router-dom';
import { Bug, History, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div
      className="d-flex align-items-center justify-content-between px-3"
      style={{
        height: '44px',
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left — logo */}
      <div className="d-flex align-items-center gap-2">
        <Bug size={16} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Debug</span>
        <span style={{
          fontSize: '10px', fontWeight: 600, padding: '1px 6px',
          border: '1px solid var(--border-color)', borderRadius: '3px',
          color: 'var(--text-muted)', letterSpacing: '0.5px'
        }}>BETA</span>
      </div>

      {/* Right — links + user + logout */}
      <div className="d-flex align-items-center gap-2">
        <Link to="/about" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>About</Link>
        <Link to="/history" className="d-flex align-items-center gap-1" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <History size={13} />
          <span className="d-none d-sm-inline">History</span>
        </Link>
        <button
          onClick={toggleTheme}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        {user && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            @{user.name?.split(' ')[0]}
          </span>
        )}
        <button
          onClick={logout}
          className="d-flex align-items-center gap-1"
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}
        >
          <LogOut size={13} />
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;