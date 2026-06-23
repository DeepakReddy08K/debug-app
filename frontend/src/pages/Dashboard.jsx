import { useState, useRef } from 'react';
import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Search, FlaskConical, MessageCircle, X, Send, HelpCircle, CheckCircle, AlertCircle, Bot, User, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { runFullPipeline, runSingleTest } from '../services/debug';
import { sendChatMessage } from '../services/chat';

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

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (loading) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [loading]);

  useEffect(() => {
  if (loading) {
    const message = 'Analysis is still running. Are you sure you want to leave?';
    // Block in-app navigation
    window.onbeforeunload = () => message;
  } else {
    window.onbeforeunload = null;
  }
  return () => { window.onbeforeunload = null; };
}, [loading]);
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const scrollToDiagnosis = () => {
    diagnosisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFindBug = async () => {
    if (!userCode.trim() || !correctCode.trim()) {
      alert('Please paste both buggy and correct code.');
      return;
    }
    setLoading(true);
    setDiagnosis(null);
    setProgressStep('Analyzing... this may take 1-2 minutes');
    try {
      const res = await runFullPipeline(userCode, correctCode, problemDetails);
      setDiagnosis({ type: 'find_bug', ...res.data.diagnosis });
      showToast('Diagnosis complete!', 'success');
      scrollToDiagnosis();
    } catch (err) {
      setDiagnosis({
        type: 'find_bug',
        scenario: 'error',
        verdict: 'Sorry, some internal error occurred. Please try again.',
      });
      showToast('Something went wrong. Please try again.', 'error');
      scrollToDiagnosis();
    } finally {
      setLoading(false);
      setProgressStep('');
    }
  };

  const handleRunTest = async () => {
    if (!userCode.trim() || !correctCode.trim()) {
      alert('Please paste both buggy and correct code.');
      return;
    }
    if (!testInput.trim()) {
      alert('Please provide a test input.');
      return;
    }
    setSingleTestLoading(true);
    setDiagnosis(null);
    try {
      const res = await runSingleTest(userCode, correctCode, testInput);
      setDiagnosis({
        type: 'single_test',
        passed: res.data.isMatching,
        buggy_output: res.data.buggyOutput,
        correct_output: res.data.correctOutput,
        input: res.data.input,
        language: res.data.language,
      });
      showToast(res.data.isMatching ? 'Outputs match!' : 'Outputs differ!', res.data.isMatching ? 'success' : 'error');
      scrollToDiagnosis();
    } catch (err) {
      setDiagnosis({
        type: 'single_test',
        scenario: 'error',
        verdict: 'Sorry, some internal error occurred. Please try again.',
      });
      showToast('Something went wrong. Please try again.', 'error');
      scrollToDiagnosis();
    } finally {
      setSingleTestLoading(false);
    }
  };

  const handleSendChat = async () => {
  if (!chatInput.trim() || chatLoading) return;
  const userMessage = chatInput;
  setChatInput('');
  setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setChatLoading(true);

  try {
    const res = await sendChatMessage(
      userMessage,
      userCode,
      correctCode,
      chatMessages,
    );
    setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.assistantResponse }]);
  } catch (err) {
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
  } finally {
    setChatLoading(false);
  }
};

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      {(loading || singleTestLoading) && (
  <div className="d-flex align-items-center justify-content-center gap-2 py-2" style={{
    backgroundColor: '#2d1a00',
    borderBottom: '1px solid #7a4400',
    fontSize: '12px',
    color: '#f5a623',
  }}>
    <span className="cf-spinner" style={{ borderColor: 'rgba(245,166,35,0.3)', borderTopColor: '#f5a623' }}></span>
    {loading ? 'Analysis is running — don\'t navigate away' : 'Test is running — don\'t navigate away'}
  </div>
)}
      {/* Scrollable main area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* Row 1 — Editors */}
        <div className="row g-0 editor-row">

          {/* Buggy code */}
          <div className="col-12 col-md-6 editor-col" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>YOUR CODE (BUGGY)</span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
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
          <div className="col-12 col-md-6 editor-col" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>CORRECT CODE (REFERENCE)</span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
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
                  padding: '8px', outline: 'none', resize: 'vertical', minHeight: '100px',
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
              {loading ? (
                  <>
                  <span className="cf-spinner"></span>
                  Processing...
                  </>
                  ) : (
                  <>
                  <Search size={14} />
                  Find Failing Test Case
                  </>
            )}
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
        <div ref={diagnosisRef} style={{ padding: '16px' }}>
          <div className="mb-3">
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DIAGNOSIS</span>
          </div>

          {/* Empty state */}
          {!diagnosis && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <HelpCircle size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No diagnosis yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>Run analysis or a single test to see results here</p>
            </div>
          )}

          {/* Error state */}
          {diagnosis && diagnosis.scenario === 'error' && (
            <div className="d-flex align-items-center gap-2 px-3 py-2" style={{
              backgroundColor: '#fff0f0', border: '1px solid #ffc1c1', borderRadius: '4px',
            }}>
              <AlertCircle size={16} color="#cf222e" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cf222e' }}>{diagnosis.verdict}</span>
            </div>
          )}

          {/* Find Bug Result */}
          {diagnosis && diagnosis.type === 'find_bug' && diagnosis.scenario !== 'error' && (() => {
            const scenarioConfig = {
              logic_bug:         { label: 'Logic Bug Found',       bg: '#2d1a00', border: '#7a4400', badgeBg: '#7a4400', color: '#f5a623' },
              syntax_error:      { label: 'Syntax/Runtime Errors', bg: '#2d0a0a', border: '#7a1a1a', badgeBg: '#cf222e', color: '#f85149' },
              compilation_error: { label: 'Compilation Error',     bg: '#2d0a0a', border: '#7a1a1a', badgeBg: '#cf222e', color: '#f85149' },
              all_correct:       { label: 'All Correct',           bg: '#0a2d0a', border: '#1a7a1a', badgeBg: '#1a7f37', color: '#3fb950' },
            };
            const cfg = scenarioConfig[diagnosis.scenario] || scenarioConfig.syntax_error;

            return (
              <div>
                {/* Verdict banner */}
                <div className="d-flex align-items-center gap-2 px-3 py-3 mb-3" style={{
                  backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '6px',
                }}>
                  {diagnosis.scenario === 'all_correct'
                    ? <CheckCircle size={18} color={cfg.color} />
                    : <AlertCircle size={18} color={cfg.color} />
                  }
                  <div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px',
                      backgroundColor: cfg.badgeBg, color: '#fff', marginRight: '8px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{cfg.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{diagnosis.verdict}</span>
                  </div>
                </div>

                {/* Failing test case */}
                {diagnosis.failing_test && (
                  <div className="mb-3" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>FAILING TEST CASE</span>
                    </div>
                    <div className="row g-0">
                      <div className="col-12 col-md-4 p-3" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>INPUT</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{diagnosis.failing_test.input}</pre>
                      </div>
                      <div className="col-12 col-md-4 p-3" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(248,81,73,0.05)' }}>
                        <p style={{ fontSize: '11px', color: '#f85149', fontWeight: 600, marginBottom: '6px' }}>YOUR OUTPUT</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{diagnosis.failing_test.buggy_output}</pre>
                      </div>
                      <div className="col-12 col-md-4 p-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(63,185,80,0.05)' }}>
                        <p style={{ fontSize: '11px', color: '#3fb950', fontWeight: 600, marginBottom: '6px' }}>EXPECTED</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>{diagnosis.failing_test.correct_output}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Root cause */}
                {diagnosis.root_cause && (
                  <div className="mb-3 px-3 py-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '4px' }}>ROOT CAUSE</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>{diagnosis.root_cause}</p>
                  </div>
                )}

                {/* Issues */}
                {diagnosis.issues && diagnosis.issues.length > 0 && (
                  <div className="mb-3">
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      ISSUES ({diagnosis.issues.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {diagnosis.issues.map((issue, i) => (
                        <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px',
                              backgroundColor: issue.type === 'logic' ? '#2d1a00' : issue.type === 'syntax' ? '#2d0a0a' : 'var(--bg-secondary)',
                              color: issue.type === 'logic' ? '#f5a623' : issue.type === 'syntax' ? '#f85149' : 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>{issue.type}</span>
                            {issue.line && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Line {issue.line}</span>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '4px 0' }}>{issue.description}</p>
                          {issue.fix && (
                            <p style={{ fontSize: '12px', color: '#3fb950', margin: 0 }}>
                              <strong>FIX:</strong> {issue.fix}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {diagnosis.improvements && diagnosis.improvements.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      IMPROVEMENTS
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {diagnosis.improvements.map((imp, i) => (
                        <div key={i} className="d-flex align-items-start gap-2" style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px',
                            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', marginTop: '1px',
                          }}>{imp.type}</span>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{imp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* Single Test Result */}
          {diagnosis && diagnosis.type === 'single_test' && diagnosis.scenario !== 'error' && (
            <div>
              <div className="d-flex align-items-center gap-2 px-3 py-3 mb-3" style={{
                backgroundColor: diagnosis.passed ? '#0a2d0a' : '#2d0a0a',
                border: `1px solid ${diagnosis.passed ? '#1a7a1a' : '#7a1a1a'}`,
                borderRadius: '6px',
              }}>
                {diagnosis.passed
                  ? <CheckCircle size={18} color="#3fb950" />
                  : <AlertCircle size={18} color="#f85149" />
                }
                <span style={{ fontSize: '13px', fontWeight: 600, color: diagnosis.passed ? '#3fb950' : '#f85149' }}>
                  {diagnosis.passed ? 'Outputs match!' : 'Outputs differ!'}
                </span>
              </div>
              <div className="row g-0" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div className="col-12 col-md-6 p-3" style={{ borderRight: '1px solid var(--border-color)', backgroundColor: diagnosis.passed ? 'rgba(63,185,80,0.05)' : 'rgba(248,81,73,0.05)' }}>
                  <p style={{ fontSize: '11px', color: diagnosis.passed ? '#3fb950' : '#f85149', fontWeight: 600, marginBottom: '6px' }}>YOUR OUTPUT</p>
                  <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{diagnosis.buggy_output}</pre>
                </div>
                <div className="col-12 col-md-6 p-3" style={{ backgroundColor: 'rgba(63,185,80,0.05)' }}>
                  <p style={{ fontSize: '11px', color: '#3fb950', fontWeight: 600, marginBottom: '6px' }}>EXPECTED OUTPUT</p>
                  <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{diagnosis.correct_output}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{
            backgroundColor: t.type === 'success' ? '#1a7f37' : t.type === 'error' ? '#cf222e' : '#0969da',
          }}>
            {t.message}
          </div>
        ))}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
  {chatMessages.length === 0 && (
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
      Ask anything about your bug or code.
    </p>
  )}
  {chatMessages.map((msg, i) => (
    <div key={i} className="d-flex align-items-start gap-2" style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
      {/* Icon */}
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {msg.role === 'user'
          ? <User size={12} color="#ffffff" />
          : <Bot size={12} color="var(--text-secondary)" />
        }
      </div>
      {/* Bubble */}
      <div style={{
        backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
        color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
        padding: '7px 10px', borderRadius: '6px',
        fontSize: '12px', maxWidth: '75%', lineHeight: '1.5',
        border: '1px solid var(--border-color)',
      }}>
        {msg.content}
      </div>
    </div>
  ))}

  {/* AI loading indicator */}
  {chatLoading && (
    <div className="d-flex align-items-start gap-2">
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={12} color="var(--text-secondary)" />
      </div>
      <div style={{
        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        padding: '7px 12px', borderRadius: '6px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <Loader2 size={12} color="var(--text-muted)" style={{ animation: 'spin 0.7s linear infinite' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thinking...</span>
      </div>
    </div>
  )}
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
              disabled={chatLoading}
              style={{
                background: chatLoading ? 'var(--bg-secondary)' : '#22c55e',
                border: 'none', borderRadius: '4px',
                padding: '6px 10px', cursor: chatLoading ? 'not-allowed' : 'pointer',
                color: chatLoading ? 'var(--text-muted)' : '#ffffff',
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