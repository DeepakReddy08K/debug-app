import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FlaskConical, Moon, Sun, History, Info, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeEditorPanel from '../components/CodeEditorPanel';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Editor state
  const [buggyCode, setBuggyCode] = useState('');
  const [correctCode, setCorrectCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Run single test state
  const [testInput, setTestInput] = useState('');

  // Pipeline state
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [runId, setRunId] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleFindBug = async () => {
    if (!buggyCode.trim() || !correctCode.trim()) {
      setError('Please paste both buggy and correct code.');
      return;
    }
    setError('');
    setLoading(true);
    setDiagnosis(null);
    setStage(null);
    setRunId(null);
    // API call will be added later
    console.log('Find bug:', { buggyCode, correctCode, additionalInfo });
    setLoading(false);
  };

  const handleRunTest = async () => {
    if (!buggyCode.trim() || !correctCode.trim()) {
      setError('Please paste both buggy and correct code first.');
      return;
    }
    if (!testInput.trim()) {
      setError('Please enter a test input.');
      return;
    }
    setError('');
    setTestLoading(true);
    setTestResult(null);
    // API call will be added later
    console.log('Run test:', { buggyCode, correctCode, testInput });
    setTestLoading(false);
  };

  // Heights
  const NAVBAR_HEIGHT = '45px';
  const EDITOR_ROW_HEIGHT = `calc((100vh - ${NAVBAR_HEIGHT}) * 0.55)`;
  const BOTTOM_ROW_HEIGHT = `calc((100vh - ${NAVBAR_HEIGHT}) * 0.45)`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        height: NAVBAR_HEIGHT,
        minHeight: NAVBAR_HEIGHT,
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--navbar-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        {/* Left — Brand */}
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>Debug</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '1px 6px',
            border: '1px solid var(--border-color)', borderRadius: '3px',
            color: 'var(--text-muted)', letterSpacing: '0.5px'
          }}>BETA</span>
        </div>

        {/* Right — Nav links */}
        <div className="d-flex align-items-center gap-2">
          <Link to="/about" className="cf-nav-link d-none d-md-flex align-items-center gap-1" style={{ textDecoration: 'none' }}>
            <Info size={13} /> About
          </Link>
          <Link to="/history" className="cf-nav-link d-none d-md-flex align-items-center gap-1" style={{ textDecoration: 'none' }}>
            <History size={13} /> History
          </Link>
          <button className="cf-btn cf-btn-secondary" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          {/* User dropdown */}
          <div className="dropdown">
            <button className="cf-btn cf-btn-secondary d-flex align-items-center gap-1" data-bs-toggle="dropdown">
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
                  <LogOut size={13} /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main content — fixed height, no scroll */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top row — Editors */}
        <div style={{
          height: EDITOR_ROW_HEIGHT,
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          {/* Buggy editor */}
          <div style={{ width: '50%', borderRight: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <CodeEditorPanel
              label="Your Code (Buggy)"
              value={buggyCode}
              onChange={setBuggyCode}
            />
          </div>
          {/* Correct editor */}
          <div style={{ width: '50%', overflow: 'hidden' }}>
            <CodeEditorPanel
              label="Correct Code (Reference)"
              value={correctCode}
              onChange={setCorrectCode}
            />
          </div>
        </div>

        {/* Bottom row — Config + Run Single Test */}
        <div style={{
          height: BOTTOM_ROW_HEIGHT,
          display: 'flex',
          flexShrink: 0,
        }}>
          {/* Left — Configuration */}
          <div style={{
            width: '50%',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '10px',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Configuration
            </span>

            {/* Additional info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Problem Details (Optional)
              </span>
              <textarea
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder={`• Problem constraints (e.g., 1 ≤ N ≤ 10^5)\n• Problem statement\n• Input/output format`}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '3px',
                  padding: '8px',
                  fontSize: '12px',
                  resize: 'none',
                  fontFamily: 'Consolas, Monaco, monospace',
                  minHeight: 0,
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</div>
            )}

            {/* Find Bug button */}
            <button
              className="cf-btn cf-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleFindBug}
              disabled={loading}
              style={{ padding: '9px', fontSize: '13px', fontWeight: 600 }}
            >
              <Search size={14} />
              {loading ? 'Analyzing...' : 'Find Failing Test Case'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              AI auto-detects language and input format
            </span>
          </div>

          {/* Right — Run Single Test */}
          <div style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '10px',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Run Single Test
            </span>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Test Input
              </span>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder={`Paste your test input here...\n\nExample:\n5\n1 2 3 4 5`}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '3px',
                  padding: '8px',
                  fontSize: '12px',
                  resize: 'none',
                  fontFamily: 'Consolas, Monaco, monospace',
                  minHeight: 0,
                }}
              />
            </div>

            {/* Run Test button */}
            <button
              className="cf-btn cf-btn-secondary w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleRunTest}
              disabled={testLoading}
              style={{ padding: '9px', fontSize: '13px', fontWeight: 600 }}
            >
              <FlaskConical size={14} />
              {testLoading ? 'Running...' : 'Run Test'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Runs both codes with your input and compares outputs
            </span>
          </div>
        </div>
      </div>

      {/* Results section — scrollable, flows below */}
      {(diagnosis || testResult) && (
        <div style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px',
          overflowY: 'auto',
          maxHeight: '60vh',
          backgroundColor: 'var(--bg-primary)',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Results will appear here...</p>
        </div>
      )}

      {/* Floating chat button */}
      <button
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
        title="AI Chat"
      >
        💬
      </button>
    </div>
  );
};

export default Dashboard;