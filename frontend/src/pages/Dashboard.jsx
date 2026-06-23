import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Search, FlaskConical, MessageCircle, X, Send, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { useRef } from 'react';

const Dashboard = () => {
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const [userCode, setUserCode] = useState('');
  const [correctCode, setCorrectCode] = useState('');
  const [problemDetails, setProblemDetails] = useState('');
  const [testInput, setTestInput] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [singleTestLoading, setSingleTestLoading] = useState(false);
  const diagnosisRef = useRef(null);
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const handleFindBug = () => {
    console.log('Find bug clicked');
    // TODO: backend connection
  };

  const handleRunTest = () => {
    console.log('Run test clicked');
    // TODO: backend connection
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
    // TODO: backend connection
  };
  const scrollToDiagnosis = () => {
    diagnosisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Scrollable main area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* Row 1 — Editors */}
        <div
          className="row g-0 editor-row">
          {/* Buggy code */}
          <div
            className="col-12 col-md-6 editor-col"
            style={{
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>YOUR CODE (BUGGY)</span>
            </div>
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme={editorTheme}
                value={userCode}
                onChange={val => setUserCode(val || '')}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on', wordWrap: 'on' }}
              />
            </div>
          </div>

          {/* Correct code */}
          <div
            className="col-12 col-md-6 editor-col"
            style={{
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CORRECT CODE (REFERENCE)</span>
            </div>
            <div style={{ flex: 1 }}>
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme={editorTheme}
                value={correctCode}
                onChange={val => setCorrectCode(val || '')}
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on', wordWrap: 'on' }}
              />
            </div>
          </div>
        </div>

        {/* Row 2 — Config + Run Single Test */}
        <div className="row g-0" style={{ borderBottom: '1px solid var(--border-color)' }}>

          {/* Configuration */}
          <div className="col-12 col-md-6" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px' }}>
            <div className="mb-2">
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CONFIGURATION</span>
            </div>
            <div className="mb-2">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Problem Details (Optional)
              </label>
              <textarea
                value={problemDetails}
                onChange={e => setProblemDetails(e.target.value)}
                placeholder={`Problem constraints (e.g., 1 ≤ N ≤ 10^5)\nProblem statement\nInput/output format`}
                rows={5}
                style={{
                  width: '100%', fontSize: '12px', fontFamily: 'monospace',
                  backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', borderRadius: '4px',
                  padding: '8px', outline: 'none', resize: 'vertical',
                  minHeight: '100px',
                }}
              />
            </div>
            <button
              onClick={handleFindBug}
              disabled={loading}
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                padding: '9px', fontSize: '13px', fontWeight: 600,
                backgroundColor: '#22c55e', color: '#ffffff',
                border: 'none', borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Search size={14} />
              {loading ? progressStep || 'Running...' : 'Find Failing Test Case'}
            </button>
            <div className="mt-1">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI auto-detects language and input format</span>
            </div>
          </div>

          {/* Run Single Test */}
          <div className="col-12 col-md-6" style={{ padding: '12px' }}>
            <div className="mb-2">
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>RUN SINGLE TEST</span>
            </div>
            <div className="mb-2">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Test Input
              </label>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder={`Paste your test input here...\n\nExample:\n5\n1 2 3 4 5`}
                rows={4}
                style={{
                  width: '100%', fontSize: '12px', fontFamily: 'monospace',
                  backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', borderRadius: '4px',
                  padding: '8px', outline: 'none', resize: 'vertical',
                }}
              />
            </div>
            <button
              onClick={handleRunTest}
              disabled={singleTestLoading}
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                padding: '9px', fontSize: '13px', fontWeight: 600,
                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: '4px',
                cursor: singleTestLoading ? 'not-allowed' : 'pointer',
                opacity: singleTestLoading ? 0.7 : 1,
              }}
            >
              <FlaskConical size={14} />
              {singleTestLoading ? 'Running...' : 'Run Test'}
            </button>
            <div className="mt-1">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Runs both codes with your input and compares outputs</span>
            </div>
          </div>

        </div>

        {/* Row 3 — Diagnosis */}
{/* Row 3 — Diagnosis */}
<div ref={diagnosisRef} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="mb-3">
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DIAGNOSIS</span>
          </div>

          {!diagnosis && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <HelpCircle size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No diagnosis yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>Run analysis or a single test to see results here</p>
            </div>
          )}

          {diagnosis && diagnosis.type === 'find_bug' && (
            <div>
              {/* Verdict banner */}
              <div className="mb-3 d-flex align-items-center gap-2 px-3 py-2" style={{
                backgroundColor: diagnosis.scenario === 'all_correct' ? '#f0fff4' : '#fff0f0',
                border: `1px solid ${diagnosis.scenario === 'all_correct' ? '#b3f0c8' : '#ffc1c1'}`,
                borderRadius: '4px',
              }}>
                {diagnosis.scenario === 'all_correct'
                  ? <CheckCircle size={16} color="#1a7f37" />
                  : <AlertCircle size={16} color="#cf222e" />
                }
                <span style={{
                  fontSize: '13px', fontWeight: 600,
                  color: diagnosis.scenario === 'all_correct' ? '#1a7f37' : '#cf222e'
                }}>
                  {diagnosis.verdict}
                </span>
              </div>

              {/* Failing test case */}
              {diagnosis.failing_test && (
                <div className="mb-3">
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Failing Test Case</p>
                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>INPUT</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{diagnosis.failing_test.input}</pre>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div style={{ backgroundColor: '#fff0f0', border: '1px solid #ffc1c1', borderRadius: '4px', padding: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#cf222e', marginBottom: '4px', fontWeight: 600 }}>YOUR OUTPUT</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{diagnosis.failing_test.buggy_output}</pre>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div style={{ backgroundColor: '#f0fff4', border: '1px solid #b3f0c8', borderRadius: '4px', padding: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#1a7f37', marginBottom: '4px', fontWeight: 600 }}>EXPECTED OUTPUT</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{diagnosis.failing_test.correct_output}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Root cause */}
              {diagnosis.root_cause && (
                <div className="mb-3 px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Root Cause</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>{diagnosis.root_cause}</p>
                </div>
              )}

              {/* Tests run summary */}
              {diagnosis.tests_run && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Tests run: {diagnosis.tests_run} — Failing: {diagnosis.tests_failing || 0}
                </p>
              )}
            </div>
          )}

          {diagnosis && diagnosis.type === 'single_test' && (
            <div>
              <div className="mb-3 d-flex align-items-center gap-2 px-3 py-2" style={{
                backgroundColor: diagnosis.passed ? '#f0fff4' : '#fff0f0',
                border: `1px solid ${diagnosis.passed ? '#b3f0c8' : '#ffc1c1'}`,
                borderRadius: '4px',
              }}>
                {diagnosis.passed
                  ? <CheckCircle size={16} color="#1a7f37" />
                  : <AlertCircle size={16} color="#cf222e" />
                }
                <span style={{ fontSize: '13px', fontWeight: 600, color: diagnosis.passed ? '#1a7f37' : '#cf222e' }}>
                  {diagnosis.passed ? 'Outputs match!' : 'Outputs differ!'}
                </span>
              </div>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div style={{ backgroundColor: diagnosis.passed ? '#f0fff4' : '#fff0f0', border: `1px solid ${diagnosis.passed ? '#b3f0c8' : '#ffc1c1'}`, borderRadius: '4px', padding: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: diagnosis.passed ? '#1a7f37' : '#cf222e', marginBottom: '4px' }}>YOUR OUTPUT</p>
                    <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{diagnosis.buggy_output}</pre>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div style={{ backgroundColor: '#f0fff4', border: '1px solid #b3f0c8', borderRadius: '4px', padding: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#1a7f37', marginBottom: '4px' }}>EXPECTED OUTPUT</p>
                    <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{diagnosis.correct_output}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* AI Chat floating button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '44px', height: '44px', borderRadius: '50%',
          backgroundColor: '#22c55e', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 200,
        }}
      >
        <MessageCircle size={20} color="#ffffff" />
      </button>

      {/* AI Chat window */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px',
          width: 'min(320px, calc(100vw - 48px))',
          height: '420px',
          backgroundColor: 'var(--navbar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 200,
        }}>
          <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Chat</span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatMessages.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                Ask anything about your bug or code.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                padding: '7px 10px', borderRadius: '6px',
                fontSize: '12px', maxWidth: '80%', lineHeight: '1.5',
              }}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 p-2" style={{ borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask about your bug..."
              style={{
                flex: 1, padding: '6px 10px', fontSize: '12px',
                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none',
              }}
            />
            <button
              onClick={handleSendChat}
              style={{
                background: '#22c55e', border: 'none', borderRadius: '4px',
                padding: '6px 10px', cursor: 'pointer', color: '#ffffff',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;