import { useEffect, useRef } from 'react';
import './NotePicker.css';

const NOTES = [
  { note: 'DO',  label: 'Do', harmony: 'Sol', color: '#e74c3c' },
  { note: 'RE',  label: 'Re', harmony: 'La',  color: '#e67e22' },
  { note: 'MI',  label: 'Mi', harmony: 'Si',  color: '#f1c40f' },
  { note: 'FA',  label: 'Fa', harmony: 'Do',  color: '#2ecc71' },
  { note: 'SOL', label: 'Sol',harmony: 'Re',  color: '#1abc9c' },
  { note: 'LA',  label: 'La', harmony: 'Mi',  color: '#3498db' },
  { note: 'SI',  label: 'Si', harmony: 'Fa', color: '#9b59b6' },
];

const NOTE_SYMBOLS = ['♩', '♪', '♫', '♬', '𝅗𝅥', '𝅘𝅥𝅮', '𝅘𝅥𝅯'];

export default function NotePicker({ title, subtitle, onPick, onClose }) {
  const audioRef = useRef(null);

  const playNote = (note) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/notes/${note}.mp3`);
    audioRef.current = audio;
    audio.play().catch(() => {}); // ignore if file missing
  };

  const handlePick = (note) => {
    playNote(note);
    setTimeout(() => onPick(note), 400); // slight delay so note plays before closing
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="note-modal-overlay" onClick={onClose}>
      <div className="note-modal" onClick={e => e.stopPropagation()}>
        <button className="note-modal-close" onClick={onClose}>✕</button>
        <div className="note-modal-header">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="notes-grid">
          {NOTES.map((n, i) => (
            <button
              key={n.note}
              className="note-btn"
              style={{ '--note-color': n.color }}
              onClick={() => handlePick(n.note)}
              onMouseEnter={() => playNote(n.note)}
            >
              <span className="note-symbol">{NOTE_SYMBOLS[i]}</span>
              <span className="note-name">{n.label}</span>
              <span className="note-harmony">harmonizes with {n.harmony}</span>
            </button>
          ))}
        </div>

        <p className="note-hint">🎵 Hover to preview · Click to pick</p>
      </div>
    </div>
  );
}