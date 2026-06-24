import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock, ChevronRight, Bug } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getHistory } from '../services/history';
import { formatDistanceToNow } from 'date-fns';

const scenarioConfig = {
  logic_bug:         { label: 'Logic Bug',     color: '#f5a623', bg: '#2d1a00', border: '#7a4400' },
  syntax_error:      { label: 'Syntax Error',  color: '#f85149', bg: '#2d0a0a', border: '#7a1a1a' },
  compilation_error: { label: 'Compile Error', color: '#f85149', bg: '#2d0a0a', border: '#7a1a1a' },
  all_correct:       { label: 'All Correct',   color: '#3fb950', bg: '#0a2d0a', border: '#1a7a1a' },
};

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getHistory();
        setHistory(res.data.history);
      } catch (err) {
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h5 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>Debug History</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>Your last 3 months of debug sessions</p>
          </div>
          <Link to="/" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
            + New Debug
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span className="cf-spinner" style={{ borderColor: 'rgba(88,166,255,0.3)', borderTopColor: 'var(--accent)', width: '20px', height: '20px', borderWidth: '3px' }}></span>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Loading history...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="d-flex align-items-center gap-2 px-3 py-2" style={{
            backgroundColor: '#fff0f0', border: '1px solid #ffc1c1', borderRadius: '4px',
          }}>
            <AlertCircle size={14} color="#cf222e" />
            <span style={{ fontSize: '13px', color: '#cf222e' }}>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Bug size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No debug sessions yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 12px' }}>Start debugging to see your history here</p>
            <Link to="/" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>Go to Dashboard</Link>
          </div>
        )}

        {/* History list */}
        {!loading && !error && history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map(run => {
              const cfg = scenarioConfig[run.scenario] || { label: run.status, color: 'var(--text-muted)', bg: 'var(--bg-secondary)', border: 'var(--border-color)' };
              return (
                <div
                  key={run.runId}
                  onClick={() => navigate(`/history/${run.runId}`)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {/* Scenario badge */}
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px',
                        backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{cfg.label}</span>

                      {/* Language badge */}
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '3px',
                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{run.language || 'cpp'}</span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={11} />
                        <span style={{ fontSize: '11px' }}>
                          {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </div>

                  {/* Verdict */}
                  {run.verdict && (
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '8px 0 0', lineHeight: '1.4' }}>
                      {run.verdict}
                    </p>
                  )}

                  {/* Code preview */}
                  {run.codePreview && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: 'monospace' }}>
                      {run.codePreview}
                    </p>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default History;