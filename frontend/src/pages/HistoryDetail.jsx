import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle, Code, FlaskConical } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import { getRunDetail } from '../services/history';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/chat';

const scenarioConfig = {
  logic_bug:         { label: 'Logic Bug',     color: '#f5a623', bg: '#2d1a00', border: '#7a4400', badgeBg: '#7a4400' },
  syntax_error:      { label: 'Syntax Error',  color: '#f85149', bg: '#2d0a0a', border: '#7a1a1a', badgeBg: '#cf222e' },
  compilation_error: { label: 'Compile Error', color: '#f85149', bg: '#2d0a0a', border: '#7a1a1a', badgeBg: '#cf222e' },
  all_correct:       { label: 'All Correct',   color: '#3fb950', bg: '#0a2d0a', border: '#1a7a1a', badgeBg: '#1a7f37' },
};

const HistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await getRunDetail(id);
        setRun(res.data);
      } catch (err) {
        setError('Failed to load run detail. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
  if (chatOpen && run?.chatMessages && chatMessages.length === 0) {
    // Load existing chat history from the run detail
    setChatMessages(run.chatMessages.map(m => ({
      role: m.role,
      content: m.content,
    })));
  }
}, [chatOpen]);

const handleSendChat = async () => {
  if (!chatInput.trim() || chatLoading) return;
  const userMessage = chatInput;
  setChatInput('');
  setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setChatLoading(true);
  try {
    const res = await sendChatMessage(
      userMessage,
      run.buggyCode,
      run.correctCode,
      chatMessages,
      run.runId,
    );
    setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.assistantResponse }]);
  } catch (err) {
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
  } finally {
    setChatLoading(false);
  }
};

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <span className="cf-spinner" style={{ borderColor: 'rgba(88,166,255,0.3)', borderTopColor: 'var(--accent)', width: '20px', height: '20px', borderWidth: '3px' }}></span>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px' }}>Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '0 16px' }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ backgroundColor: '#fff0f0', border: '1px solid #ffc1c1', borderRadius: '4px' }}>
          <AlertCircle size={14} color="#cf222e" />
          <span style={{ fontSize: '13px', color: '#cf222e' }}>{error}</span>
        </div>
      </div>
    </div>
  );

  const diagnosis = run.aiDiagnosis;
  const cfg = scenarioConfig[diagnosis?.scenario] || { label: run.status, color: 'var(--text-muted)', bg: 'var(--bg-secondary)', border: 'var(--border-color)', badgeBg: 'var(--bg-secondary)' };
  const passedTests = run.testCases?.filter(tc => !tc.is_failing).length || 0;
  const failedTests = run.testCases?.filter(tc => tc.is_failing).length || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => navigate('/history')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={16} />
            <span style={{ fontSize: '13px' }}>History</span>
          </button>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Run #{run.runId}</span>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px',
              backgroundColor: cfg.badgeBg, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{cfg.label}</span>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '3px',
              backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
              border: '1px solid var(--border-color)', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{run.language}</span>
          </div>
        </div>

        {/* AI Diagnosis */}
        {diagnosis && (
          <div className="mb-4" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div className="px-3 py-2 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <AlertCircle size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AI DIAGNOSIS</span>
            </div>
            <div style={{ padding: '16px' }}>

              {/* Verdict banner */}
              <div className="d-flex align-items-center gap-2 px-3 py-3 mb-3" style={{
                backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '6px',
              }}>
                {diagnosis.scenario === 'all_correct'
                  ? <CheckCircle size={16} color={cfg.color} />
                  : <AlertCircle size={16} color={cfg.color} />
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

              {/* Failing test */}
              {diagnosis.failing_test && (
                <div className="mb-3" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>FAILING TEST CASE</span>
                  </div>
                  <div className="row g-0">
                    <div className="col-12 col-md-4 p-3" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>INPUT</p>
                      <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{diagnosis.failing_test.input}</pre>
                    </div>
                    <div className="col-12 col-md-4 p-3" style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(248,81,73,0.05)' }}>
                      <p style={{ fontSize: '11px', color: '#f85149', fontWeight: 600, marginBottom: '6px' }}>YOUR OUTPUT</p>
                      <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{diagnosis.failing_test.buggy_output}</pre>
                    </div>
                    <div className="col-12 col-md-4 p-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(63,185,80,0.05)' }}>
                      <p style={{ fontSize: '11px', color: '#3fb950', fontWeight: 600, marginBottom: '6px' }}>EXPECTED</p>
                      <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{diagnosis.failing_test.correct_output}</pre>
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
                          {issue.line && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Line {issue.line}</span>}
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
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '8px' }}>IMPROVEMENTS</p>
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
          </div>
        )}

        {/* Source Code */}
        <div className="mb-4" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div className="px-3 py-2 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <Code size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SOURCE CODE</span>
          </div>
          <div className="row g-0">
            <div className="col-12 col-md-6" style={{ borderRight: '1px solid var(--border-color)' }}>
              <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#f85149', fontWeight: 600 }}>⊗ Buggy Code</span>
              </div>
              <div style={{ height: '300px' }}>
                <Editor
                  height="100%"
                  language={run.language || 'cpp'}
                  theme={editorTheme}
                  value={run.buggyCode || ''}
                  options={{ fontSize: 12, minimap: { enabled: false }, readOnly: true, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on' }}
                />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: '#3fb950', fontWeight: 600 }}>✓ Correct Code</span>
              </div>
              <div style={{ height: '300px' }}>
                <Editor
                  height="100%"
                  language={run.language || 'cpp'}
                  theme={editorTheme}
                  value={run.correctCode || ''}
                  options={{ fontSize: 12, minimap: { enabled: false }, readOnly: true, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        {run.testCases && run.testCases.length > 0 && (
          <div className="mb-4" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div className="px-3 py-2 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <FlaskConical size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                TEST CASES ({passedTests} PASSED, {failedTests} FAILED)
              </span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {run.testCases.map((tc, i) => (
                <div key={tc.id} style={{ border: `1px solid ${tc.is_failing ? '#7a1a1a' : 'var(--border-color)'}`, borderRadius: '6px', overflow: 'hidden' }}>
                  <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Test #{i + 1}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px',
                      backgroundColor: tc.is_failing ? '#cf222e' : '#1a7f37', color: '#fff',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{tc.is_failing ? 'FAIL' : 'PASS'}</span>
                  </div>
                  <div className="p-3">
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>INPUT</p>
                    <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '0 0 10px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px' }}>{tc.input_data}</pre>
                    {tc.output_buggy !== null && (
                      <div className="row g-2">
                        <div className="col-12 col-md-6">
                          <p style={{ fontSize: '11px', color: '#f85149', fontWeight: 600, marginBottom: '4px' }}>YOUR OUTPUT</p>
                          <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: 'rgba(248,81,73,0.05)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(248,81,73,0.2)' }}>{tc.output_buggy}</pre>
                        </div>
                        <div className="col-12 col-md-6">
                          <p style={{ fontSize: '11px', color: '#3fb950', fontWeight: 600, marginBottom: '4px' }}>EXPECTED</p>
                          <pre style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: 'rgba(63,185,80,0.05)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(63,185,80,0.2)' }}>{tc.output_correct}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Chat — Run #{run.runId}</span>
      <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
        <X size={14} />
      </button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {chatMessages.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
          Ask anything about this debug session.
        </p>
      )}
      {chatMessages.map((msg, i) => (
        <div key={i} className="d-flex align-items-start gap-2" style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
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
        placeholder="Ask about this debug session..."
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

export default HistoryDetail;