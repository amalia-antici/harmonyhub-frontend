import { useState } from 'react';
import Navbar from '../components/Navbar';
import './PoetryBoard.css'; // Add styling here

const WORD_BANK = [
  'echo',
  'neon',
  'shadow',
  'velvet',
  'midnight',
  'ghost',
  'electric',
  'whisper',
  'anchor',
  'smoke',
  'gravity',
  'satellite',
  'static',
  'horizon',
  'wildfire',

  'honey',
  'fever',
  'crimson',
  'ember',
  'mirage',
  'serpent',
  'lantern',
  'ocean',
  'thunder',
  'diamond',
  'runaway',
  'reckless',
  'paradise',
  'hollow',
  'starlight',

  'tidal',
  'paper',
  'golden',
  'silhouette',
  'ripple',
  'storm',
  'dust',
  'cinder',
  'mercy',
  'dagger',
  'phoenix',
  'violet',
  'chaos',
  'orbit',
  'bloom',

  'shiver',
  'afterglow',
  'moonlit',
  'broken',
  'radiant'
];

export default function PoetryBoard() {
  // Initialize standard random words
  const [wordPool, setWordPool] = useState(
    WORD_BANK.map((w, index) => ({ id: `word-${index}`, text: w }))
  );
  const [boardWords, setBoardWords] = useState([]);

  // Keep track of which item is currently being dragged
  const [draggedItem, setDraggedItem] = useState(null);
  const [sourceZone, setSourceZone] = useState(''); // 'pool' or 'board'

  const handleDragStart = (item, zone) => {
    setDraggedItem(item);
    setSourceZone(zone);
  };

  const handleDrop = (e, targetZone) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Moving from pool to the songwriting board
    if (sourceZone === 'pool' && targetZone === 'board') {
      setWordPool(prev => prev.filter(w => w.id !== draggedItem.id));
      setBoardWords(prev => [...prev, draggedItem]);
    }
    // Moving from songwriting board back to the pool
    else if (sourceZone === 'board' && targetZone === 'pool') {
      setBoardWords(prev => prev.filter(w => w.id !== draggedItem.id));
      setWordPool(prev => [...prev, draggedItem]);
    }

    // Reset tracking states
    setDraggedItem(null);
    setSourceZone('');
  };

  const allowDrop = (e) => {
    e.preventDefault(); // Crucial! Tells the browser dropping is permitted here.
  };

  const handleClearBoard = () => {
    setWordPool(WORD_BANK.map((w, index) => ({ id: `word-${index}`, text: w })));
    setBoardWords([]);
  };

  return (
    <div className="poetry-page">
      <Navbar />
      <main className="poetry-main">
        <div className="poetry-header">
          <h1>Magnetic Poetry Board</h1>
          <p>Drag words into the canvas below to construct your song hook!</p>
          <button className="crud-btn black" onClick={handleClearBoard}>Reset Magnets</button>
        </div>

        {/* --- THE CANVAS BOARD ZONE --- */}
        <div 
          className="poetry-canvas-zone"
          onDragOver={allowDrop}
          onDrop={(e) => handleDrop(e, 'board')}
        >
          {boardWords.length === 0 ? (
            <p className="canvas-placeholder">Drag word magnets here to compose...</p>
          ) : (
            <div className="magnet-composition-line">
              {boardWords.map(word => (
                <span
                  key={word.id}
                  draggable
                  onDragStart={() => handleDragStart(word, 'board')}
                  className="word-magnet"
                >
                  {word.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* --- THE WORD MAGNET RESERVOIR POOL --- */}
        <div 
          className="poetry-pool-zone"
          onDragOver={allowDrop}
          onDrop={(e) => handleDrop(e, 'pool')}
        >
          <h3>Your Word Reservoir</h3>
          <div className="magnets-grid">
            {wordPool.map(word => (
              <span
                key={word.id}
                draggable
                onDragStart={() => handleDragStart(word, 'pool')}
                className="word-magnet"
              >
                {word.text}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}