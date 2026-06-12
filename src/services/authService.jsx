const AUTH_KEYS = {
  USER: 'harmonyhub-user',
  TOKEN: 'harmonyhub-token',
  LAST_ACTIVITY: 'harmonyhub-last-activity',
};

const LEGACY_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  LAST_ACTIVITY: 'lastActivity',
};

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const BASE_URL = import.meta.env.VITE_API_URL || '';

function readStorageItem(primaryKey, legacyKey) {
  return localStorage.getItem(primaryKey) ?? localStorage.getItem(legacyKey);
}

function writeStorageItem(primaryKey, legacyKey, value) {
  localStorage.setItem(primaryKey, value);
  localStorage.setItem(legacyKey, value);
}

export function getCurrentUser() {
  try {
    const user = readStorageItem(AUTH_KEYS.USER, LEGACY_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Failed to parse user from storage', error);
    return null;
  }
}

export function getToken() {
  return readStorageItem(AUTH_KEYS.TOKEN, LEGACY_KEYS.TOKEN);
}

export function getLastActivity() {
  return readStorageItem(AUTH_KEYS.LAST_ACTIVITY, LEGACY_KEYS.LAST_ACTIVITY);
}

export function setLastActivity() {
  const value = Date.now().toString();
  writeStorageItem(AUTH_KEYS.LAST_ACTIVITY, LEGACY_KEYS.LAST_ACTIVITY, value);
}

export function isSessionExpired() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return true;
  return Date.now() - Number(lastActivity) > INACTIVITY_TIMEOUT;
}

export function saveSession(userData) {
  writeStorageItem(AUTH_KEYS.USER, LEGACY_KEYS.USER, JSON.stringify(userData));
  writeStorageItem(AUTH_KEYS.TOKEN, LEGACY_KEYS.TOKEN, userData.token);
  setLastActivity();
  window.dispatchEvent(new Event('storage'));
}

export async function updateCurrentUser(updates) {
  const token = getToken(); // Extract your session authentication token
  
  const response = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Protect the route with your existing session JWT
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(errorMsg || 'Failed to update profile on the server.');
  }

  const updatedUserFromServer = await response.json();

  // Keep your local client storage perfectly synced with your persistent database row modifications
  writeStorageItem(AUTH_KEYS.USER, LEGACY_KEYS.USER, JSON.stringify(updatedUserFromServer));
  
  return updatedUserFromServer;
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEYS.USER);
  localStorage.removeItem(AUTH_KEYS.TOKEN);
  localStorage.removeItem(AUTH_KEYS.LAST_ACTIVITY);
  localStorage.removeItem(LEGACY_KEYS.USER);
  localStorage.removeItem(LEGACY_KEYS.TOKEN);
  localStorage.removeItem(LEGACY_KEYS.LAST_ACTIVITY);
  window.dispatchEvent(new Event('storage'));
}

export function hasRole(roleName) {
  const user = getCurrentUser();
  if (!user?.roles) return false;
  return user.roles.some((role) => {
    if (typeof role === 'string') return role === roleName;
    return role?.name === roleName || role?.authority === roleName;
  });
}

export function isAdmin() {
  return hasRole('ROLE_ADMIN');
}

async function apiRequest(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const errorText = isJson
      ? await response.json().then(json => json?.message || JSON.stringify(json)).catch(() => response.statusText)
      : await response.text();
    throw new Error(errorText || 'Request failed');
  }

  if (isJson) {
    return response.json();
  }

  return response.text();
}

export function login(username, password) {
  return apiRequest('/api/auth/login', { username, password });
}

export function register(formData) {
  return apiRequest('/api/auth/register', formData);
}

export function refreshSessionIfActive() {
  if (isSessionExpired()) {
    clearSession();
    return false;
  }
  setLastActivity();
  return true;
}

export function loginStep1(username, password) {
  return apiRequest('/api/auth/login/step1', { username, password });
}

export async function loginStep2(partialToken, emailOtp) {
  const response = await fetch(`${BASE_URL}/api/auth/login/step2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${partialToken}`
    },
    body: JSON.stringify({ emailOtp })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text);
  return JSON.parse(text);
}

export async function loginStep3(partialToken, securityAnswer) {
  const response = await fetch(`${BASE_URL}/api/auth/login/step3`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${partialToken}`
    },
    body: JSON.stringify({ securityAnswer })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text);
  return JSON.parse(text);
}