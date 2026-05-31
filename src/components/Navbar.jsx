import Cookies from "js-cookie";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser, isAdmin } from '../services/authService.jsx';

export default function Navbar() {
  const [lastEvent, setLastEvent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = Cookies.get('last_viewed_event');
    if (saved) setLastEvent(saved);

    const updateUser = () => setCurrentUser(getCurrentUser());
    updateUser();

    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  // const handleLogout = (e) => {
  //   e.preventDefault();
  //   localStorage.removeItem("user");
  //   setCurrentUser(null);
  //   navigate('/login');
  // };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    navigate('/login');
  };
  
  const isAdminUser = isAdmin();

  return (
    <header className="navbar-big">
      <div className="logo-place">
        <div className="logo">
          <img src="/logo.png" alt="Harmony Hub logo" />
          {lastEvent && (
            <span style={{ fontSize: '12px', color: 'gray' }}>
              Continue looking at: <strong>{lastEvent}</strong>?
            </span>
          )}
        </div>

        <div className="user-profile">
          <img src="/profile-picture.png" alt="profile" />
          <h5>{currentUser ? currentUser.username : "Guest"}</h5>
        </div>
      </div>

      <div className="nav-bar">
        <div className="fast-access">
          <div className="nav-bar-elem">
            <a href="/">Home Page</a>
            <a href="/events">Events</a>
            <a href="/my-events">My Events</a>
            <a href="/create">Create an event</a>
            <a href="#">Connect</a>
            <a href="#">Challenge</a>
            <a href="/chat">Chat</a>
            {/* NEW: Admin specific link */}
            {isAdminUser && (
              <a href="/admin/logs" style={{ color: '#ff4d4d', fontWeight: 'bold' }}>
                Admin Logs
              </a>
            )}
          </div>
        </div>

        <div className="log-out">
          {currentUser ? (
            <a href="#" onClick={handleLogout}>Log out</a>
          ) : (
            <a href="/login">Log in</a>
          )}
        </div>
      </div>
    </header>
  );
}