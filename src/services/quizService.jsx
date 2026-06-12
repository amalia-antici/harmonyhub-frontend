import { getToken } from './authService.jsx';
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const getQuestions = async () => {
  const res = await fetch(`${BASE_URL}/api/quiz/questions`);
  if (!res.ok) throw new Error('Failed to load questions');
  return res.json();
};

export const submitAnswers = async (answers) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(answers)
  });
  return res.json();
};

export const getLeaderboard = async () => {
  const res = await fetch(`${BASE_URL}/api/quiz/leaderboard`);
  return res.json();
};