const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  const stored = localStorage.getItem('auth_token');
  return stored;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  // Backend wraps responses in { data, statusCode, timestamp }
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
