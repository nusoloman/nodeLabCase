const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get access token
function getToken() {
  return localStorage.getItem('accessToken');
}

// Generic request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let message = 'Bir hata oluştu';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  return apiRequest<{ accessToken: string; refreshToken: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function register(
  username: string,
  email: string,
  password: string
) {
  return apiRequest<{ accessToken: string; refreshToken: string }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function getMe() {
  return apiRequest<{ user: any }>('/auth/me');
}

// User list
export async function getUserList() {
  return apiRequest<{ users: any[] }>('/user/list');
}

// Conversation list
export async function getConversationList() {
  return apiRequest<{ conversations: any[] }>('/conversation/list');
}

// Message history
export async function getMessageHistory(conversationId: string) {
  return apiRequest<{ messages: any[] }>(`/message/history/${conversationId}`);
}

// Send message (returns message and conversationId)
export async function sendMessage(receiver: string, content: string) {
  return apiRequest<{ data: any; conversationId: string }>('/message/send', {
    method: 'POST',
    body: JSON.stringify({ receiver, content }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Profil güncelleme
export async function updateProfile(username: string, email: string) {
  return apiRequest<{ user: any }>('/user/profile', {
    method: 'PATCH',
    body: JSON.stringify({ username, email }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Add more endpoints as needed...
