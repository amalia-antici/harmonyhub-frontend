import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VoiceRecorder from '../components/VoiceRecorder';
import VoicePostCard from '../components/VoicePostCard';
import { getFeed, createPost } from '../services/voicePostService.jsx';
import { getCurrentUser } from '../services/authService.jsx';
import './VoiceFeed.css'

export default function VoiceFeed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [audio, setAudio] = useState(null);
  const [description, setDescription] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadFeed(0);
  }, []);

  const loadFeed = async (pageNum) => {
    const data = await getFeed(pageNum);
    if (pageNum === 0) {
      setPosts(data.content);
    } else {
      setPosts(prev => [...prev, ...data.content]);
    }
    setHasMore(!data.last);
    setPage(pageNum);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!audio) { setError('Please record something first.'); return; }
    setPosting(true);
    setError('');
    try {
      const newPost = await createPost(audio, description);
      setPosts(prev => [newPost, ...prev]);
      setAudio(null);
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
        <h2>Voice Feed</h2>

        {/* Post creation — only for logged in users */}
        {currentUser && (
          <div className="create-post">
            <h3>Share your voice</h3>
            <VoiceRecorder onRecordingComplete={setAudio} />
            <textarea
              placeholder="Add a short description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button
              onClick={handlePost}
              disabled={posting || !audio}
              className="btn-post-anonymous"
            >
              {posting ? 'Posting...' : 'Post anonymously'}
            </button>
          </div>
        )}

        {/* Feed */}
        <div className="feed">
          {posts.map(post => (
            <VoicePostCard key={post.id} post={post} />
          ))}
        </div>

        {hasMore && (
        <div className="load-more-container">
            <button onClick={() => loadFeed(page + 1)} className="btn-load-more">
            Load More
            </button>
        </div>
)}
      </main>
    </div>
  );
}