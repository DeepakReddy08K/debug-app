// frontend/src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { Bug, History, Sun, Moon, LogOut, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const planBadgeStyle = (slug) => {
  switch (slug) {
    case 'pro':     return { background: '#6366f1', color: '#fff' };
    case 'premium': return { background: '#f59e0b', color: '#fff' };
    default:        return { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' };
  }
};

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, plan, usage } = useAuth();

  const usagePercent = usage?.limit
    ? Math.min(100, (usage.used / usage.limit) * 100)
    : 0;

  const isNearLimit = usage?.limit && usage.remaining <= 1;

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
      <Link to="/" style={{ textDecoration: 'none' }} className="d-flex align-items-center gap-2">
        <Bug size={16} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Debug</span>
        <span style={{
          fontSize: '10px', fontWeight: 600, padding: '1px 6px',
          border: '1px solid var(--border-color)', borderRadius: '3px',
          color: 'var(--text-muted)', letterSpacing: '0.5px'
        }}>BETA</span>
      </Link>

      {/* Right */}
      <div className="d-flex align-items-center gap-2">
        <Link to="/about" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>About</Link>

        <Link to="/history" className="d-flex align-items-center gap-1" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <History size={13} />
          <span className="d-none d-sm-inline">History</span>
        </Link>

        {/* Pricing link */}
        <Link to="/pricing" className="d-flex align-items-center gap-1" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <Zap size={13} />
          <span className="d-none d-sm-inline">Pricing</span>
        </Link>

        {/* Usage indicator — only for free plan */}
        {plan && usage?.limit && (
          <div
            title={`${usage.used}/${usage.limit} runs used`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'default' }}
          >
            <div style={{
              width: '48px', height: '4px',
              background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden'
            }}>
              <div style={{
                width: `${usagePercent}%`,
                height: '100%',
                background: isNearLimit ? '#ef4444' : '#6366f1',
                borderRadius: '2px',
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{
              fontSize: '11px',
              color: isNearLimit ? '#ef4444' : 'var(--text-muted)'
            }}>
              {usage.used}/{usage.limit}
            </span>
          </div>
        )}

        {/* Plan badge */}
        {plan && (
          <Link
            to="/pricing"
            style={{
              fontSize: '10px', fontWeight: 700,
              padding: '2px 7px', borderRadius: '4px',
              textDecoration: 'none', letterSpacing: '0.5px',
              ...planBadgeStyle(plan.slug),
            }}
          >
            {plan.slug.toUpperCase()}
          </Link>
        )}

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