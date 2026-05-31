import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp
} from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "700px", margin: "30px auto", padding: "0 20px" }}>
        <h2>Community Chat</h2>

        <div style={{
          height: "450px", overflowY: "auto", border: "1px solid #ddd",
          borderRadius: "12px", padding: "16px", marginBottom: "16px",
          display: "flex", flexDirection: "column", gap: "10px",
          background: "#fafafa"
        }}>
          {messages.length === 0 && (
            <p style={{ color: "#aaa", textAlign: "center", marginTop: "auto" }}>
              No messages yet. Say hello! 
            </p>
          )}
          {messages.map((msg) => {
            const isMe = String(msg.senderId) === String(user?.id);
            return (
              <div key={msg.id} style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                background: isMe ? "#333" : "#e9e9e9",
                color: isMe ? "#fff" : "#000",
                padding: "10px 14px", borderRadius: "18px",
                maxWidth: "70%", fontSize: "14px"
              }}>
                {!isMe && (
                  <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>
                    {msg.senderName}
                  </div>
                )}
                <div>{msg.content}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          <button className="crud-btn black" onClick={sendMessage}>
            Send
          </button>
        </div>
      </main>
    </>
  );
}