import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getAllUsers, sendHarmonizeRequest } from '../services/friendService.jsx';
import './ConnectPage.css';
import NotePicker from '../components/NotePicker';

export default function ConnectPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [pickingFor, setPickingFor] = useState(null); 

  useEffect(() => {
    getAllUsers()
      .then(data => { 
        setUsers(data || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.skills || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleHarmonize = (userId) => {
    setPickingFor(userId);
  };

  const handleNotePicked = async (note) => {
    try {
        await sendHarmonizeRequest(pickingFor, note);
        setSent(prev => new Set(prev).add(pickingFor));
    } catch (err) {
        alert(err.message);
    } finally {
        setPickingFor(null);
    }
  };

  return (
    <div className="connect-page">
      <Navbar />
      <main className="connect-main">
        {/* ... header block stays identical ... */}

        {loading ? (
          <p className="connect-loading">Finding people...</p>
        ) : (
          <div className="connect-grid">
            {filtered.map(u => {
              // 🛠️ FIX: Determine button disabled state dynamically based on response parameters
              // Checks local UI click state ('sent') OR active un-resolved database flags
              const isPending = sent.has(u.id) || u.friendshipStatus === 'PENDING';
              const isAccepted = u.friendshipStatus === 'ACCEPTED';
              
              return (
                <div key={u.id} className="user-card">
                  <div className="user-card-top">
                    <img
                      src={u.photo || '/profile-picture.png'}
                      alt={u.username}
                      className="user-card-avatar"
                    />
                    <div className="user-card-info">
                      <h3>{u.username}</h3>
                      {(u.city || u.country) && (
                        <p className="user-card-location">
                          📍 {[u.city, u.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {u.bio && <p className="user-card-bio">{u.bio}</p>}

                  {u.skills && (
                    <div className="user-card-skills">
                      {u.skills.split(',').map(s => (
                        <span key={s} className="skill-tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}

                  {/* 🛠️ FIX: Updated condition logic below */}
                  <button
                    className={`btn-harmonize ${isPending ? 'sent' : ''} ${isAccepted ? 'friends' : ''}`}
                    onClick={() => handleHarmonize(u.id)}
                    disabled={isPending || isAccepted}
                  >
                    {isAccepted && '✓ Connected!'}
                    {!isAccepted && isPending && '✓ Request Sent'}
                    {!isAccepted && !isPending && '🎵 Harmonize'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pickingFor && (
          <NotePicker
            title="Send a Harmonize Request"
            subtitle="Pick a musical note to send. The other person must play its harmony to connect!"
            onPick={handleNotePicked}
            onClose={() => setPickingFor(null)}
          />
        )}
      </main>
    </div>
  );
}