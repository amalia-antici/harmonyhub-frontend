import { getToken } from './authService.jsx';
const BASE_URL = import.meta.env.VITE_API_URL || '';

export const getActiveChallenge = async () => {
  const res = await fetch(`${BASE_URL}/api/challenges/active`);
  if (!res.ok) throw new Error('No active challenge');
  return res.json();
};

export const getWinners = async (challengeId) => {
  const res = await fetch(`${BASE_URL}/api/challenges/${challengeId}/winners`);
  return res.json();
};

export const submitChallenge = async (challengeId, instagramLink) => {
  const res = await fetch(`${BASE_URL}/api/challenges/${challengeId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ instagramLink })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createChallenge = async (data) => {
  const res = await fetch(`${BASE_URL}/api/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSubmissions = async (challengeId) => {
  const res = await fetch(`${BASE_URL}/api/challenges/${challengeId}/submissions`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  return res.json();
};

export const gradeSubmission = async (submissionId, grade, winner) => {
  const res = await fetch(`${BASE_URL}/api/challenges/submissions/${submissionId}/grade`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ grade, winner })
  });
  return res.json();
};