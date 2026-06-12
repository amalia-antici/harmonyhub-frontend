import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection, addDoc, onSnapshot, deleteDoc, doc,
  orderBy, query, serverTimestamp, updateDoc
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import "./Chat.css"; 

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const audioRef = useRef(null);
  
  // Aux Cord States
  const [queue, setQueue] = useState([]);
  const [songTitleInput, setSongTitleInput] = useState("");
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [showAddTrack, setShowAddTrack] = useState(false);

  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    // 1. Listen to Chat Messages
    const qMessages = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    // 2. Listen to Real-time Aux Cord Queue
    const qQueue = query(collection(db, "aux_queue"), orderBy("addedAt", "asc"));
    const unsubscribeQueue = onSnapshot(qQueue, (snapshot) => {
      const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueue(tracks);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeQueue();
    };
  }, [navigate]);

  // Sync Audio Playback positions
  useEffect(() => {
    if (queue.length > 0 && queue[0].startedAt && audioRef.current) {
      // Check to ensure toDate() exists (handles latency when serverTimestamp is generating)
      if (typeof queue[0].startedAt.toDate !== 'function') return;

      const startTime = queue[0].startedAt.toDate(); 
      const now = new Date();
      
      // Calculate difference in seconds
      const elapsedSeconds = (now - startTime) / 1000; 

      // If the song is still playing, skip ahead to catch up
      if (elapsedSeconds > 0) {
        audioRef.current.currentTime = elapsedSeconds;
      }
    }
  }, [queue, queue[0]?.id]); // ⚡ Fixed: Used queue[0]?.id instead of currentTrack?.id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    await addDoc(collection(db, "messages"), {
      senderId: String(user.id),
      senderName: user.username,
      content: input.trim(),
      timestamp: serverTimestamp()
    });

    setInput("");
  };

  // Aux Cord Actions
  const handleAddToQueue = async (e) => {
    e.preventDefault();
    if (!songTitleInput.trim() || !audioUrlInput.trim()) return;

    const isQueueEmpty = queue.length === 0;

    await addDoc(collection(db, "aux_queue"), {
      title: songTitleInput.trim(),
      audioUrl: audioUrlInput.trim(),
      addedBy: user.username,
      addedAt: serverTimestamp(),
      startedAt: isQueueEmpty ? serverTimestamp() : null 
    });

    await addDoc(collection(db, "messages"), {
      senderId: "system",
      senderName: "📻 Hub DJ",
      content: `🎵 Added "${songTitleInput.trim()}" to the Aux Cord!`,
      timestamp: serverTimestamp()
    });

    setSongTitleInput("");
    setAudioUrlInput("");
    setShowAddTrack(false);
  };

  const handleTrackEnded = async () => {
    if (queue.length > 0) {
      const currentTrackDocRef = doc(db, "aux_queue", queue[0].id);
      await deleteDoc(currentTrackDocRef);
    }
  };

  // Automatically start the next track if it is waiting in line
  useEffect(() => {
    if (queue.length > 0 && !queue[0].startedAt) {
      const startNextTrack = async () => {
        const trackRef = doc(db, "aux_queue", queue[0].id);
        await updateDoc(trackRef, {
          startedAt: serverTimestamp()
        });
      };
      startNextTrack();
    }
  }, [queue]);

  const currentTrack = queue[0] || null;

  return (
    <>
      <Navbar />
      <main className="chat-main-container">
        <h2>Community Chat</h2>

        {/* --- THE AUX CORD CONTAINER --- */}
        <div className="aux-cord-panel">
          <div className="aux-header">
            <div className="aux-status-info">
              <span className="live-badge">● LIVE AUX</span>
              {currentTrack ? (
                <p className="track-title">
                  Playing: <strong>{currentTrack.title}</strong> <small>by @{currentTrack.addedBy}</small>
                </p>
              ) : (
                <p className="track-title empty">The Aux Cord is quiet. Pass a song!</p>
              )}
            </div>
            <button 
              className="btn-toggle-aux"
              onClick={() => setShowAddTrack(!showAddTrack)}
            >
              {showAddTrack ? "Close" : "🔌 Pass Aux"}
            </button>
          </div>

          {currentTrack && (
            <audio 
              ref={audioRef}
              src={currentTrack.audioUrl} 
              controls 
              autoPlay 
              onEnded={handleTrackEnded}
              className="aux-audio-player"
            />
          )}

          {/* Form to queue track links */}
          {showAddTrack && (
            <form onSubmit={handleAddToQueue} className="aux-input-form">
              <input 
                type="text" 
                placeholder="Song Title" 
                value={songTitleInput}
                onChange={e => setSongTitleInput(e.target.value)}
                required
              />
              <input 
                type="url" 
                placeholder="Direct Audio URL (.mp3 or Cloudinary audio link)" 
                value={audioUrlInput}
                onChange={e => audioUrlInput.startsWith("data:audio") ? alert("Please use direct web URLs or uploaded assets links instead of heavy base64 items directly in firestore!") : setAudioUrlInput(e.target.value)}
                required
              />
              <button type="submit" className="crud-btn black">Queue Track</button>
            </form>
          )}

          {queue.length > 1 && (
            <div className="aux-up-next">
              <span>Up Next ({queue.length - 1}):</span>
              <div className="next-tracks-pills">
                {queue.slice(1).map((track, i) => (
                  <span key={track.id} className="next-pill">
                    {i + 1}. {track.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* --- END OF AUX CORD --- */}

        {/* Chat Stream Panel */}
        <div className="chat-box-stream">
          {messages.length === 0 && (
            <p className="empty-chat-placeholder">
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = String(msg.senderId) === String(user?.id);
            const isSystem = msg.senderId === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="chat-message-bubble system-notice">
                  {msg.content}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`chat-message-bubble ${isMe ? "me" : "them"}`}>
                {!isMe && <div className="sender-name-label">{msg.senderName}</div>}
                <div>{msg.content}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-controls-bar">
          <input
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
          />
          <button className="crud-btn black" onClick={sendMessage}>
            Send
          </button>
        </div>
      </main>
    </>
  );
}