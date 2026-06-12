import { useState, useEffect } from 'react';
import { getActiveChallenge, getWinners, submitChallenge } from '../services/challengeService.jsx';
import { getCurrentUser } from '../services/authService.jsx';
import Navbar from '../components/Navbar.jsx';
import './ChallengePage.css';

export default function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [winners, setWinners] = useState([]);
  const [link, setLink] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    getActiveChallenge()
      .then(c => {
        setChallenge(c);
        return getWinners(c.id);
      })
      .then(setWinners)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitChallenge(challenge.id, link);
      setSubmitted(true);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!challenge) return <div><Navbar /><p style={{textAlign:'center', marginTop:'4rem'}}>No active challenge right now. Check back soon!</p></div>;

  const podium = [winners[1], winners[0], winners[2]].filter(Boolean); // 2nd, 1st, 3rd order

  return (
    <div className="challenge-page">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="challenge-hero">
          <p className="challenge-label">✦ Challenge of the Week ✦</p>
          <h1>{challenge.title}</h1>
          <p className="challenge-desc">{challenge.description}</p>
          {challenge.hashtag && (
            <p className="challenge-hashtag">Don't forget to use <strong>{challenge.hashtag}</strong> on your post!</p>
          )}
          {currentUser && !submitted && (
            <button className="btn-submit-challenge" onClick={() => setShowModal(true)}>
              Submit your challenge post
            </button>
          )}
          {submitted && <p className="success-msg">✓ Submission received!</p>}
        </section>

        {/* Winners podium */}
        {winners.length > 0 && (
          <section className="winners-section">
            <h2>Our Winners</h2>
            <div className="podium">
              {podium.map((w, i) => {
                const place = i === 0 ? 2 : i === 1 ? 1 : 3;
                return (
                  <div key={w.id} className={`podium-card place-${place}`}>
                    <img src={w.userPhoto || '/profile-picture.png'} alt={w.username} />
                    <span className="podium-place">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</span>
                    <p className="podium-username">{w.username}</p>
                    {w.grade && <p className="podium-grade">{w.grade}/10</p>}
                    <a href={w.instagramLink} target="_blank" rel="noreferrer" className="podium-link">
                      access post
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Submit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Submit your post</h3>
            <form onSubmit={handleSubmit}>
              <label>Link to Instagram Post</label>
              <input
                type="url"
                placeholder="https://instagram.com/p/..."
                value={link}
                onChange={e => setLink(e.target.value)}
                required
              />
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}