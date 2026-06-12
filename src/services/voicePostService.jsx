import { getToken } from './authService.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function getFeed(page = 0, size = 10) {
  const response = await fetch(`${BASE_URL}/api/voice-posts?page=${page}&size=${size}`);
  if (!response.ok) throw new Error('Failed to fetch feed');
  return response.json();
}

export async function getPost(id) {
  const response = await fetch(`${BASE_URL}/api/voice-posts/${id}`);
  if (!response.ok) throw new Error('Post not found');
  return response.json();
}

export async function createPost(audio, description) {
  const response = await fetch(`${BASE_URL}/api/voice-posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ audio, description })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function getComments(postId) {
  const response = await fetch(`${BASE_URL}/api/voice-posts/${postId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
}

export async function addComment(postId, content) {
  const response = await fetch(`${BASE_URL}/api/voice-posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}