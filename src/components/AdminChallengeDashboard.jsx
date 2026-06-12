import { useState, useEffect } from 'react';
import { getActiveChallenge, getSubmissions, gradeSubmission, createChallenge } from '../services/challengeService.jsx';
import Navbar from '../components/Navbar';
import './AdminChallengeDashboard.css';
export default function AdminChallengeDashboard() {
  const [challenge, setChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', hashtag: '', startsAt: '', endsAt: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getActiveChallenge()
      .then(c => { setChallenge(c); return getSubmissions(c.id); })
      .then(setSubmissions)
      .catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const c = await createChallenge(form);
    setChallenge(c);
    setSubmissions([]);
    setCreating(false);
  };

  const handleGrade = async (submissionId, grade, winner) => {
    const updated = await gradeSubmission(submissionId, Number(grade), winner);
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...updated } : s));
  };

  // ↓ No Navbar, no admin-dashboard wrapper — just the content
  return (
    <div>
      <div className="admin-header">
        <h1>Challenge of the Week</h1>
        <button onClick={() => setCreating(prev => !prev)} className="btn-new">
          {creating ? 'Cancel' : '+ New Challenge'}
        </button>
      </div>

      {creating && (
        <form className="create-form" onSubmit={handleCreate}>
          <h2>Create New Challenge</h2>
          <label>Title</label>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          <label>Hashtag (e.g. #harmonyhub)</label>
          <input value={form.hashtag} onChange={e => setForm({...form, hashtag: e.target.value})} />
          <div className="date-row">
            <div>
              <label>Starts At</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} />
            </div>
            <div>
              <label>Ends At</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} />
            </div>
          </div>
          <button type="submit">Create & Activate</button>
        </form>
      )}

      {challenge && (
        <div className="active-challenge-banner">
          <span className="active-dot" /> Active: <strong>{challenge.title}</strong>
        </div>
      )}

      {submissions.length > 0 ? (
        <table className="submissions-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Instagram Post</th>
              <th>Submitted</th>
              <th>Grade (1-10)</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="user-cell">
                    <img src={s.userPhoto || '/profile-picture.png'} alt="" />
                    {s.username}
                  </div>
                </td>
                <td>
                  <a href={s.instagramLink} target="_blank" rel="noreferrer">View post ↗</a>
                </td>
                <td>{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td>
                  <input
                    type="number" min="1" max="10"
                    defaultValue={s.grade || ''}
                    className="grade-input"
                    onBlur={e => handleGrade(s.id, e.target.value, s.winner)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    defaultChecked={s.winner}
                    onChange={e => handleGrade(s.id, s.grade, e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        challenge && <p className="no-submissions">No submissions yet.</p>
      )}
    </div>
  );
}