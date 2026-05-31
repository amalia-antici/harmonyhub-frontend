import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession, loginStep1, loginStep2, loginStep3 } from '../services/authService.jsx';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [partialToken, setPartialToken] = useState('');
  const [step, setStep] = useState(1); // 1 = credentials, 2 = email OTP, 3 = security question
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Step 1: username + password
  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginStep1(username, password);
      setPartialToken(data.token);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: email OTP
  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginStep2(partialToken, emailOtp);
      setPartialToken(data.token);
      setSecurityQuestion(data.question);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: security question
  const handleStep3 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginStep3(partialToken, securityAnswer);
      saveSession(data);
      navigate('/events');
    } catch (err) {
      setError(err.message || 'Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Credentials', 'Email Verify', 'Security'];

  return (
    <div className="login-page">
      <div className="music-note note-1">♪</div>
      <div className="music-note note-2">♫</div>
      <div className="music-note note-3">♬</div>
      <div className="music-note note-4">♩</div>

      <header className="login-header">
        <div className="logo-container">
          <h1 className="logo-text">HARMONYHUB</h1>
          <div className="logo-decoration"></div>
        </div>
      </header>

      <main className="login-container">
        <h2 className="welcome-title">Welcome back!</h2>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '600',
                backgroundColor: step > i + 1 ? '#4caf50' : step === i + 1 ? '#333' : '#ddd',
                color: step >= i + 1 ? '#fff' : '#999',
                transition: 'all 0.3s ease'
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '11px', color: step === i + 1 ? '#333' : '#aaa' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <form className="login-card" onSubmit={handleStep1}>
            {error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text" id="username" placeholder="Enter your username"
                value={username} onChange={(e) => setUsername(e.target.value)} required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password" id="password" placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Authenticating...' : 'Continue →'}
            </button>

            <div className="form-footer">
              <a href="/forgot-password">Forgot password?</a>
              <a href="/signup">Sign Up</a>
            </div>
          </form>
        )}

        {/* Step 2: Email OTP */}
        {step === 2 && (
          <form className="login-card" onSubmit={handleStep2}>
            {error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              A 6-digit verification code has been sent to your email address.
            </p>

            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text" id="otp" placeholder="Enter 6-digit code"
                maxLength={6} value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                required style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center' }}
              />
            </div>

            <button type="submit" className="signin-button" disabled={loading || emailOtp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code →'}
            </button>

            <div className="form-footer">
              <button type="button" onClick={() => { setStep(1); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Security Question */}
        {step === 3 && (
          <form className="login-card" onSubmit={handleStep3}>
            {error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '8px' }}>
              Please answer your security question:
            </p>
            <p style={{
              textAlign: 'center', fontWeight: '600', color: '#333',
              fontSize: '15px', marginBottom: '20px',
              padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px'
            }}>
              {securityQuestion}
            </p>

            <div className="input-group">
              <label htmlFor="answer">Your Answer</label>
              <input
                type="text" id="answer" placeholder="Enter your answer"
                value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)}
                required style={{ textTransform: 'lowercase' }}
              />
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In ✓'}
            </button>

            <div className="form-footer">
              <button type="button" onClick={() => { setStep(2); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}