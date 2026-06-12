import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCurrentUser, updateCurrentUser, getToken, saveSession } from '../services/authService.jsx';
import { getFriends, getPendingRequests, respondToRequest } from '../services/friendService.jsx';
// --- Assuming NotePickerModal is located in your components folder. Fix path if needed! ---
import NotePicker from '../components/NotePicker'; 
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'friends' | 'notifications'
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }

    const token = getToken();
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfileData(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          username: data.username || '',
          country: data.country || '',
          city: data.city || '',
          occupation: data.occupation || '',
          instagram: data.instagram || '',
          skills: data.skills || '',
          bio: data.bio || '',
          photo: data.photo || ''
        });
        setPhotoPreview(data.photo || '/profile-picture.png');
      })
      .catch(() => navigate('/login'));

    getFriends().then(setFriends).catch(() => {});
    getPendingRequests().then(setPending).catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    const name = e.target.name === 'skills2' ? 'skills' : e.target.name;
    setFormData({ ...formData, [name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image is too large (max 5MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setFormData(prev => ({ ...prev, photo: reader.result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const currentToken = getToken();
    try {
      const updated = await updateCurrentUser({ ...formData });
      if (updated) {
        saveSession({ ...updated, token: currentToken });
        setProfileData(updated);
        setMessage('Profile saved successfully!');
      }
    } catch (err) {
      setError(err.message || 'Unable to save profile.');
    }
  };

  const handleRespond = async (note) => {
    if (!respondingTo) return;
    try {
      const result = await respondToRequest(respondingTo.id, note);
      setPending(prev => prev.filter(r => r.id !== respondingTo.id));
      setRespondingTo(null);

      if (result?.harmonized) {
        getFriends().then(setFriends);
        setMessage('🎶 You harmonized! New friend added.');
      } else {
        setMessage("💔 The notes didn't harmonize. Request declined.");
      }
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError('Failed to respond to request.');
    }
  };

  if (!profileData) return <div><Navbar /><p style={{textAlign:'center',padding:'3rem'}}>Loading...</p></div>;

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">

        {/* ── Hero card ── */}
        <div className="profile-hero">
          <img src={photoPreview} alt="profile" className="profile-hero-avatar" />
          <div className="profile-hero-info">
            <h1>{profileData.username}</h1>
            {(profileData.city || profileData.country) && (
              <p className="profile-hero-location">
                📍 {[profileData.city, profileData.country].filter(Boolean).join(', ')}
              </p>
            )}
            {profileData.occupation && <p className="profile-hero-occupation">{profileData.occupation}</p>}
            {profileData.bio && <p className="profile-hero-bio">{profileData.bio}</p>}
            {profileData.skills && (
              <div className="profile-hero-skills">
                {profileData.skills.split(',').map(s => (
                  <span key={s} className="skill-tag">{s.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          {['edit', 'friends', 'notifications'].map(tab => (
            <button
              key={tab}
              className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'edit' && 'Edit Profile'}
              {tab === 'friends' && `Friends ${friends.length > 0 ? `(${friends.length})` : ''}`}
              {tab === 'notifications' && `Requests ${pending.length > 0 ? `(${pending.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── Edit tab ── */}
        {activeTab === 'edit' && (
          <div className="profile-edit-section">
            <div className="profile-upload-row">
              <label htmlFor="profileUpload" className="profile-upload-label">
                <img src={photoPreview} alt="" />
                <span>Change photo</span>
              </label>
              <input id="profileUpload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
              {(error || message) && (
                <p className={error ? 'form-error' : 'form-success'}>{error || message}</p>
              )}
              <div className="profile-form-grid">
                <div className="input-field">
                  <label>First name</label>
                  <input name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Last name</label>
                  <input name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>Username</label>
                  <input name="username" value={formData.username || ''} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label>City</label>
                  <input name="city" value={formData.city || ''} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Country</label>
                  <input name="country" value={formData.country || ''} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Occupation</label>
                  <input name="occupation" value={formData.occupation || ''} onChange={handleChange} />
                </div>
                <div className="input-field">
                  <label>Instagram</label>
                  <input name="instagram" value={formData.instagram || ''} onChange={handleChange} />
                </div>
                <div className="input-field full-width">
                  <label>Skills (comma separated)</label>
                  <input name="skills2" value={formData.skills || ''} onChange={handleChange} />
                </div>
                <div className="input-field full-width">
                  <label>Bio</label>
                  <textarea name="bio" rows={4} value={formData.bio || ''} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn-save">Save changes</button>
            </form>
          </div>
        )}

        {/* ── Friends tab ── */}
        {activeTab === 'friends' && (
          <div className="profile-friends">
            {friends.length === 0 ? (
              <p className="empty-state">No friends yet. Go to Connect to find people!</p>
            ) : (
              <div className="friends-grid">
                {friends.map(f => (
                  <div key={f.id} className="friend-card">
                    <img src={f.photo || '/profile-picture.png'} alt={f.username} />
                    <p>{f.username}</p>
                    {f.city && <span>📍 {f.city}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Notifications tab ── */}
        {activeTab === 'notifications' && (
          <div className="profile-notifications">
            {pending.length === 0 ? (
              <p className="empty-state">No pending requests.</p>
            ) : (
              <div className="requests-stack">
                {pending.map(req => (
                  <div key={req.id} className="notif-card">
                    <img src={req.sender.photo || '/profile-picture.png'} alt={req.sender.username} />
                    <div className="notif-info">
                      <p><strong>{req.sender.username}</strong> wants to harmonize with you!</p>
                      {req.sender.city && <span>📍 {req.sender.city}</span>}
                    </div>
                    <div className="notif-actions">
                      <div className="notif-sender-note">
                        They played <strong>{req.senderNote}</strong>
                      </div>
                      <button className="btn-accept" onClick={() => setRespondingTo(req)}>
                        🎵 Play your note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Note Picker Modal Overlay ── */}
        {respondingTo && (
          <NotePicker
            title="Play Your Harmony"
            subtitle={`${respondingTo.sender.username} played ${respondingTo.senderNote}. Pick the note that harmonizes with it!`}
            onPick={handleRespond}
            onClose={() => setRespondingTo(null)}
          />
        )}

      </main>
    </div>
  );
}