import { getToken } from './authService.jsx';

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/events`
  : '/api/events';

// Normalize event objects returned by the backend into the shape the frontend expects
export const normalizeEvent = (e) => {
  if (!e) return e;
  return {
    Id: e.Id ?? e.id ?? e._id,
    Title: e.Title ?? e.title,
    Location: e.Location ?? e.location,
    City: e.City ?? e.city,
    Country: e.Country ?? e.country,
    EventType: e.EventType ?? e.eventType ?? e.event_type,
    Genre: e.Genre ?? e.genre,
    Capacity: e.Capacity ?? e.capacity,
    ReservedSpots: e.ReservedSpots ?? e.reservedSpots ?? e.reserved_spots ?? 0,
    Description: e.Description ?? e.description,
    DateTime: e.DateTime ?? e.dateTime ?? e.date_time,
    PhotoUrl: e.PhotoUrl ?? e.photoUrl ?? e.photo_url,
    FormLink: e.FormLink ?? e.formLink ?? e.form_link,
    Tags: e.Tags ?? e.tags ?? [],
    createdBy: e.createdBy ?? e.created_by ?? e.created_by_user_id ?? e.CreatedBy ?? e.owner,
    ...e
  };
};

function buildHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = payload?.message || payload || response.statusText || 'Request failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return payload;
}

export async function getEvents(page = 0, size = 10) {
  const payload = await fetchJson(`${API_URL}?page=${page}&size=${size}`);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeEvent);
  return payload;
}

export async function getEventById(id) {
  const payload = await fetchJson(`${API_URL}/${id}`, {
    method: 'GET',
    headers: buildHeaders() 
  });
  return normalizeEvent(payload);
}

export async function createEvent(event) {
  return fetchJson(API_URL, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(event),
  }).then(normalizeEvent);
}

export async function updateEvent(id, event) {
  return fetchJson(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(event),
  }).then(normalizeEvent);
}

export async function deleteEventById(id) {
  return fetchJson(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
}

export async function getAuditLogs() {
  return fetchJson(`${API_URL}/logs`, {
    method: 'GET',
    headers: buildHeaders(),
  });
}

export async function getObservationList() {
  return fetchJson(`${API_URL}/observations`, {
    method: 'GET',
    headers: buildHeaders(),
  });
}

// generator status endpoint removed

export const validateEvent = (event) => {
  return event.Title?.trim().length > 3 && event.City?.trim().length > 2;
};

export const formatEventDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ro-RO');
};

export async function getAiAnalysis() {
  return fetchJson(`${API_URL}/observations/ai-analysis`, {
    method: 'GET',
    headers: buildHeaders(),
  });
}

export async function searchEvents(page = 0, size = 10, filters = {}) {
  const params = new URLSearchParams({ page, size });
  if (filters.genre && filters.genre !== 'ALL') params.append('genre', filters.genre);
  if (filters.city?.trim()) params.append('city', filters.city.trim());
  if (filters.date) params.append('date', filters.date);
  const payload = await fetchJson(`${API_URL}/search?${params}`);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeEvent);
  return payload;
}

export async function toggleEventAttendance(id, isAttending) {
  return fetchJson(`${API_URL}/${id}/attend?isAttending=${isAttending}`, {
    method: 'PATCH',
    headers: buildHeaders(),
  }).then(normalizeEvent);
}