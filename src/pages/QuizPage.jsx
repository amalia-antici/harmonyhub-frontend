import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getQuestions, submitAnswers, getLeaderboard } from '../services/quizService.jsx';
import { getCurrentUser } from '../services/authService.jsx';
import './QuizPage.css';

const PHASES = { INTRO: 'intro', PLAYING: 'playing', RESULTS: 'results' };

export default function QuizPage() {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});       
  const [selected, setSelected] = useState(null);   
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    getLeaderboard().then(setLeaderboard).catch(() => {});
  }, []);

  const startGame = async () => {
    setLoading(true);
    try {
      const qs = await getQuestions();
      setQuestions(qs);
      setAnswers({});
      setCurrent(0);
      setSelected(null);
      setResults(null);
      setPhase(PHASES.PLAYING);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    setSelected(answer);
    setAnswers(prev => ({ ...prev, [questions[current].id]: answer }));
  };

  const handleNext = async () => {
    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
      setSelected(null);
    } else {
      // Last question — submit
      setLoading(true);
      try {
        const finalAnswers = { ...answers, [questions[current].id]: selected };
        const res = await submitAnswers(finalAnswers);
        setResults(res);
        setPhase(PHASES.RESULTS);
        getLeaderboard().then(setLeaderboard); // refresh leaderboard
      } finally {
        setLoading(false);
      }
    }
  };

  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  return (
    <div className="quiz-page">
      <Navbar />
      <main className="quiz-main">

        {/* ── INTRO ── */}
        {phase === PHASES.INTRO && (
          <div className="quiz-intro">
            <div className="quiz-intro-icon">📜 🎵</div>
            <h1>Shakespeare or Songwriter?</h1>
            <p>Can you tell the difference between the Bard and a pop star?</p>
            <p className="quiz-intro-sub">10 quotes · No time limit · Share your score</p>
            <button className="btn-start" onClick={startGame} disabled={loading}>
              {loading ? 'Loading...' : 'Start Quiz'}
            </button>

            {leaderboard.length > 0 && (
              <div className="quiz-leaderboard">
                <h3>🏆 Top Scores</h3>
                {leaderboard.slice(0, 5).map((s, i) => (
                  <div key={i} className="leaderboard-row">
                    <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <img src={s.photo || '/profile-picture.png'} alt="" />
                    <span className="lb-username">{s.username}</span>
                    <span className="lb-score">{s.score}/{s.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === PHASES.PLAYING && questions.length > 0 && (
          <div className="quiz-playing">
            {/* Progress */}
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="quiz-counter">{current + 1} / {questions.length}</p>

            {/* Quote card */}
            <div className="quiz-card" key={current}>
              <div className="quiz-quote-mark">"</div>
              <p className="quiz-quote">{questions[current].text}</p>
              {questions[current].hint && (
                <p className="quiz-hint">💡 {questions[current].hint}</p>
              )}
            </div>

            {/* Choices */}
            <div className="quiz-choices">
              <button
                className={`quiz-choice shakespeare ${selected === 'SHAKESPEARE' ? 'chosen' : ''}`}
                onClick={() => handleAnswer('SHAKESPEARE')}
                disabled={!!selected}
              >
                <span className="choice-icon">📜</span>
                <span className="choice-label">Shakespeare</span>
              </button>
              <button
                className={`quiz-choice artist ${selected === 'SONGWRITER' ? 'chosen' : ''}`}
                onClick={() => handleAnswer('SONGWRITER')}
                disabled={!!selected}
              >
                <span className="choice-icon">🎵</span>
                <span className="choice-label">Artist / Lyric</span>
              </button>
            </div>

            {selected && (
              <button className="btn-next" onClick={handleNext} disabled={loading}>
                {current < questions.length - 1 ? 'Next →' : loading ? 'Submitting...' : 'See Results'}
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === PHASES.RESULTS && results && (
          <div className="quiz-results">
            <div className="results-score-circle">
              <span className="results-score-num">{results.score}</span>
              <span className="results-score-total">/{results.total}</span>
            </div>

            <h2>{getScoreMessage(results.score, results.total)}</h2>
            {!currentUser && <p className="results-login-hint">Log in to save your score to the leaderboard!</p>}

            {/* Answer breakdown */}
            <div className="results-breakdown">
              {results.results.map((r, i) => (
                <div key={r.id} className={`result-row ${r.correct ? 'correct' : 'wrong'}`}>
                  <span className="result-icon">{r.correct ? '✓' : '✗'}</span>
                  <div className="result-info">
                    <p className="result-quote">"{r.text}"</p>
                    <p className="result-author">
                      — {r.author} &nbsp;·&nbsp;
                      <em>{r.hint}</em>
                    </p>
                    {!r.correct && (
                      <p className="result-correction">
                        You said {r.yourAnswer === 'SHAKESPEARE' ? '📜 Shakespeare' : '🎵 Songwriter'} ·
                        Answer was {r.correctAnswer === 'SHAKESPEARE' ? '📜 Shakespeare' : '🎵 Songwriter'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-actions">
              <button className="btn-start" onClick={startGame}>Play Again</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function getScoreMessage(score, total) {
  const pct = score / total;
  if (pct === 1)   return '🎭 Perfect! You might be Shakespeare yourself!';
  if (pct >= 0.8)  return '🌟 Excellent! You know your quotes!';
  if (pct >= 0.6)  return '🎵 Not bad! You have a good ear.';
  if (pct >= 0.4)  return '📖 Keep reading... and listening!';
  return '🎲 Were you just guessing?';
}