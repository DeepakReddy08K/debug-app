import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bug, Zap, Play, Code, GitCompare, Shield, History, Globe } from 'lucide-react';

const About = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav className="cf-navbar d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <span className="cf-navbar-brand">Debug App</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/login" className="cf-nav-link" style={{ textDecoration: 'none' }}>Sign in</Link>
          <Link to="/signup" className="cf-btn cf-btn-primary" style={{ textDecoration: 'none' }}>
            Get Started
          </Link>
          <button className="cf-btn cf-btn-secondary" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '760px', paddingTop: '50px', paddingBottom: '60px' }}>

        {/* Hero */}
        <div className="text-center mb-5">
          <div className="mb-3" style={{ color: 'var(--accent)' }}>
            <Bug size={40} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '16px' }}>
            Find bugs in seconds, <span style={{ color: 'var(--accent)' }}>not hours.</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto' }}>
            Debug is an AI-powered differential debugger for competitive programming. Paste your buggy code and a correct solution — it automatically generates test cases, finds the failing input, and tells you exactly what's wrong.
          </p>
        </div>

        {/* How it works */}
        <div className="cf-card mb-4">
          <h6 style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
            How It Works
          </h6>
          <div className="row g-3">
            {[
              {
                step: '1',
                icon: <Code size={18} />,
                title: 'Paste Both Codes',
                desc: 'Paste your buggy code and a correct reference solution side by side.'
              },
              {
                step: '2',
                icon: <Zap size={18} />,
                title: 'AI Analyzes the Problem',
                desc: 'The system parses constraints, detects the language, and checks for syntax or runtime errors automatically.'
              },
              {
                step: '3',
                icon: <GitCompare size={18} />,
                title: 'Auto-Generated Test Cases',
                desc: 'Smart test cases are generated based on problem constraints and executed against both codes to find mismatches.'
              },
              {
                step: '4',
                icon: <Bug size={18} />,
                title: 'Pinpoint the Bug',
                desc: 'AI diagnoses the exact logical error, shows the failing test case, and suggests a precise fix.'
              },
            ].map(item => (
              <div key={item.step} className="col-12 col-md-6">
                <div style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  height: '100%'
                }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      color: 'var(--accent)', letterSpacing: '0.5px'
                    }}>
                      STEP {item.step}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--accent)' }}>
                    {item.icon}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 0, lineHeight: '1.5' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="cf-card mb-4">
          <h6 style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>
            Features
          </h6>
          <div className="row g-2">
            {[
              { icon: <GitCompare size={14} />, title: 'Differential Debugging', desc: 'Compares your code against a correct solution to find the exact input that breaks your logic.' },
              { icon: <Shield size={14} />, title: 'Syntax & Runtime Detection', desc: 'Catches compilation errors and runtime crashes (segfaults, TLE) before test execution.' },
              { icon: <Zap size={14} />, title: 'AI-Powered Diagnosis', desc: 'AI analysis pinpoints root causes with line-specific fixes — no generic advice.' },
              { icon: <Play size={14} />, title: 'Run Single Test', desc: 'Test your own custom input and instantly compare outputs side-by-side.' },
              { icon: <History size={14} />, title: 'Full Run History', desc: 'Every debugging session is saved with test cases, outputs, and AI diagnosis for 3 months.' },
              { icon: <Globe size={14} />, title: 'Multi-Language Support', desc: 'Works with C++, Python, Java, and JavaScript out of the box.' },
            ].map(item => (
              <div key={item.title} className="col-12 col-md-6">
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--accent)' }}>
                    {item.icon}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 0, lineHeight: '1.5' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cf-card text-center">
          <h6 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
            Ready to debug smarter?
          </h6>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Join and start finding bugs in seconds.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <Link to="/signup" className="cf-btn cf-btn-primary" style={{ padding: '8px 24px', textDecoration: 'none' }}>
              Get Started
            </Link>
            <Link to="/login" className="cf-btn cf-btn-secondary" style={{ padding: '8px 24px', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;