import { getToken } from './authService.jsx';
const BASE_URL = import.meta.env.VITE_API_URL || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const getAllUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/friends/users`, { headers: authHeaders() });
  return res.json();
};

export const getPendingRequests = async () => {
  const res = await fetch(`${BASE_URL}/api/friends/pending`, { headers: authHeaders() });
  return res.json();
};

export const getFriends = async () => {
  const res = await fetch(`${BASE_URL}/api/friends`, { headers: authHeaders() });
  return res.json();
};

export const sendHarmonizeRequest = async (receiverId, note) => {
  const res = await fetch(`${BASE_URL}/api/friends/request/${receiverId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ note })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const respondToRequest = async (friendshipId, note) => {
  const res = await fetch(`${BASE_URL}/api/friends/respond/${friendshipId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ note })
  });
  return res.json();
};