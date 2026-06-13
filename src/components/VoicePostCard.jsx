import { useState, useEffect } from 'react';
import { getComments, addComment } from '../services/voicePostService.jsx';
import { getCurrentUser } from '../services/authService.jsx';
import './VoicePostCard.css';

export default function VoicePostCard({ post }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const currentUser = getCurrentUser();

  // Countdown to reveal
  useEffect(() => {
    if (post.revealed) return;

    const update = () => {
      if (!post.revealAt) return;
      let standardizedDateStr = post.revealAt.trim();
      
      standardizedDateStr = standardizedDateStr.replace(' ', 'T');

      if (!standardizedDateStr.endsWith('Z') && !standardizedDateStr.includes('+')) {
        standardizedDateStr = `${standardizedDateStr}Z`;
      }

      const diff = new Date(standardizedDateStr) - new Date();

      if (diff <= 0) {
        setTimeLeft('Revealing soon...');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [post.revealAt, post.revealed]);

  const loadComments = async () => {
    if (!showComments) {
      const data = await getComments(post.id);
      setComments(data);
    }
    setShowComments(prev => !prev);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = await addComment(post.id, newComment);
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  return (
    <div className="voice-post-card">
      {/* Author */}
      <div className="post-author">
        {post.revealed ? (
          <>
            <img
              src={post.author?.photo || '/profile-picture.png'}
              alt="author"
              className="author-avatar"
            />
            <span>{post.author?.username}</span>
          </>
        ) : (
          <>
            <div className="anonymous-avatar">?</div>
            <span>Anonymous · revealed in {timeLeft}</span>
          </>
        )}
      </div>

      {/* Audio player */}
      <audio controls src={post.audioUrl} className="audio-player" />

      {/* Description */}
      {post.description && <p className="post-description">{post.description}</p>}

      {/* Comments */}
      <button onClick={loadComments} className="btn-comments">
        {showComments ? 'Hide comments' : 'Show comments'}
      </button>

      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <img src={c.author.photo || '/profile-picture.png'} alt="" className="comment-avatar" />
              <div>
                <span className="comment-username">{c.author.username}</span>
                <p>{c.content}</p>
              </div>
            </div>
          ))}

          {currentUser && (
            <form onSubmit={handleAddComment} className="comment-form">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
              />
              <button type="submit">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
