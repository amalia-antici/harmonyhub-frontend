import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text);
      } else {
        setMessage(text);
      }
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
        <h2 className="welcome-title">New Password</h2>
        {message ? (
          <div className="login-card" style={{ textAlign: 'center' }}>
            <p style={{ color: '#4caf50', marginBottom: '20px' }}>✓ {message}</p>
            <button className="signin-button" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        ) : (
          <form className="login-card" onSubmit={handleSubmit}>
            {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>}
            <div className="input-group">
              <label>New Password</label>
              <input type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password" required />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password" required />
            </div>
            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}