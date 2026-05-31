import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const text = await res.text();
      setMessage(text);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="logo-container">
          <h1 className="logo-text">HARMONYHUB</h1>
        </div>
      </header>
      <main className="login-container">
        <h2 className="welcome-title">Reset Password</h2>
        {message ? (
          <div className="login-card" style={{ textAlign: 'center' }}>
            <p style={{ color: '#4caf50', marginBottom: '20px' }}>✓ {message}</p>
            <button className="signin-button" onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        ) : (
          <form className="login-card" onSubmit={handleSubmit}>
            {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              Enter your email address and we'll send you a reset link.
            </p>
            <div className="input-group">
              <label>Email address</label>
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="form-footer">
              <a href="/login">Back to login</a>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}