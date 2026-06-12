import Cookies from "js-cookie";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser, isAdmin } from '../services/authService.jsx';
import './Navbar.css';

export default function Navbar() {
  const [lastEvent, setLastEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = Cookies.get('last_viewed_event');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLastEvent(parsed);
      } catch (e) {
        setLastEvent({ title: saved });
      }
    }
    const updateUser = () => setCurrentUser(getCurrentUser());
    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 6000);
    return () => clearTimeout(t);
  }, [lastEvent]);

  const dismissToast = () => {
    Cookies.remove('last_viewed_event');
    setLastEvent(null);
    setShowToast(false);
  };

  const handleProfileClick = () => {
    navigate(currentUser ? '/profile' : '/login');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    navigate('/login');
  };

  const [openDropdown, setOpenDropdown] = useState(null); // 'games' | 'discover' | null

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const isAdminUser = isAdmin();

  return (  // ← this was missing entirely
    <>
      <header className="navbar-big">

        {/* ── Logo strip ── */}
        <div className="logo-place">
          <div className="logo">
            <img src="/logo.png" alt="Harmony Hub logo" />
          </div>
          <div className="user-profile" onClick={handleProfileClick}>
            <img
              src={currentUser?.photo || currentUser?.profilePicture || "/profile-picture.png"}
              alt="profile"
            />
            <h5>{currentUser ? currentUser.username : "Guest"}</h5>
          </div>
        </div>

        {/* ── Nav row ── */}
        <div className="nav-bar">

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Menu"
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>

          <div className={`fast-access ${menuOpen ? 'open' : ''}`}>
            <div className="nav-bar-elem">

              <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
              <a href="/events" onClick={() => setMenuOpen(false)}>Events</a>
              <a href="/my-events" onClick={() => setMenuOpen(false)}>My Events</a>
              <a href="/connect" onClick={() => setMenuOpen(false)}>Connect</a>
              <a href="/chat" onClick={() => setMenuOpen(false)}>Chat</a>

              <div className={`nav-dropdown ${openDropdown === 'games' ? 'open' : ''}`}>
        <button
          className="nav-dropdown-trigger"
          onClick={() => toggleDropdown('games')}
        >
          🎮 Games
        </button>
        <div className="nav-dropdown-menu">
          <a href="/challenge" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon">🏆</span> Challenge
          </a>
          <a href="/quiz" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon">📜</span> Lyric Quiz
          </a>
        </div>
      </div>

      <div className={`nav-dropdown ${openDropdown === 'discover' ? 'open' : ''}`}>
        <button
          className="nav-dropdown-trigger"
          onClick={() => toggleDropdown('discover')}
        >
          ✨ Discover
        </button>
        <div className="nav-dropdown-menu">
          <a href="/poetry" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon">📝</span> Poetry Board
          </a>
          <a href="/voice" onClick={() => setMenuOpen(false)}>
            <span className="menu-icon">🎵</span> Voice Posts
          </a>
        </div>
      </div>

              {isAdminUser && (
                <a href="/admin/logs" className="nav-admin-link" onClick={() => setMenuOpen(false)}>
                  ⚙ Admin
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

      {/* ── Toast ── */}
      {showToast && lastEvent && (
        <div className="last-event-toast" role="status" aria-live="polite">
          <div className="toast-content">
            Continue looking at: <strong>{lastEvent.title || lastEvent}</strong>?
          </div>
          <div className="toast-actions">
            <button className="close-btn" onClick={dismissToast} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}
    </>
  );
}