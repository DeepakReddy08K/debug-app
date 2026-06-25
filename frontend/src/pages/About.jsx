import { Link } from 'react-router-dom';
import { Bug, Zap, Play, Code, Brain, History, Globe, GitCompare, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';

const steps = [
  { step: '1', icon: <Code size={16} />, title: 'Paste Both Codes', desc: 'Paste your buggy code and a correct reference solution side by side.' },
  { step: '2', icon: <Zap size={16} />, title: 'AI Analyzes', desc: 'Detects language, checks syntax errors, and builds a problem schema.' },
  { step: '3', icon: <GitCompare size={16} />, title: 'Generate Test Cases', desc: 'Smart test cases are generated and run against both codes to find mismatches.' },
  { step: '4', icon: <Bug size={16} />, title: 'Pinpoint the Bug', desc: 'AI diagnoses the exact logical error and suggests a precise fix.' },
];

const features = [
  { icon: <GitCompare size={14} />, title: 'Differential Debugging', desc: 'Compares your code against a correct solution to find the exact failing input.' },
  { icon: <Shield size={14} />, title: 'Syntax & Runtime Detection', desc: 'Catches compilation errors and runtime crashes before test execution.' },
  { icon: <Play size={14} />, title: 'Run Single Test', desc: 'Test your own custom input and compare outputs side by side.' },
  { icon: <History size={14} />, title: 'Full Run History', desc: 'Every session is saved with test cases and AI diagnosis for 3 months.' },
  { icon: <Globe size={14} />, title: 'Multi-Language Support', desc: 'Works with C++, Python, Java, and JavaScript.' },
];



const About = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Hero */}
        <div className="text-center mb-4">
          <div className="mb-2" style={{ color: 'var(--accent)' }}>
            <Bug size={32} />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '12px' }}>
            Find bugs in seconds, <span style={{ color: 'var(--accent)' }}>not hours.</span>
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto' }}>
            Debug is an AI-powered differential debugger for competitive programming. Paste your buggy code and a correct solution — it automatically generates test cases, finds the failing input, and tells you exactly what's wrong.
          </p>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* How it works */}
        <div className="mb-4">
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>HOW IT WORKS</p>
          <div className="row g-2">
            {steps.map(s => (
              <div key={s.step} className="col-12 col-md-6">
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', height: '100%' }}>
                  <div className="mb-1">
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px' }}>STEP {s.step}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--accent)' }}>
                    {s.icon}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* Features */}
        <div className="mb-4">
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '12px' }}>FEATURES</p>
          <div className="row g-2">
            {features.map(f => (
              <div key={f.title} className="col-12 col-md-6">
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--accent)' }}>
                    {f.icon}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* CTA */}
        <div className="text-center">
          <h6 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Ready to debug smarter?</h6>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>Start finding bugs in seconds.</p>
          <Link to="/" style={{
            fontSize: '13px', fontWeight: 600, padding: '8px 24px',
            backgroundColor: 'var(--accent)', color: '#ffffff',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            Start Debugging
          </Link>
        </div>

      </div>
    </div>
  );
};

export default About;