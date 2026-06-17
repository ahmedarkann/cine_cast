const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'cinecast_access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (value) => {
  if (value) {
    localStorage.setItem(TOKEN_KEY, value);
  }
};
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const request = async (path, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token && !(options.body instanceof FormData)) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data?.message || response.statusText || 'API request failed');
    error.status = response.status;
    error.response = data;
    throw error;
  }
  return data;
};

export const get = (path) => request(path, { method: 'GET' });
export const post = (path, body) => request(path, { method: 'POST', body });
export const put = (path, body) => request(path, { method: 'PUT', body });
export const del = (path) => request(path, { method: 'DELETE' });

export const uploadFile = async ({ file }) => {
  const form = new FormData();
  form.append('file', file);
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Upload failed');
  }
  return response.json();
};

// Helper to build query string from an object
export const buildQueryParams = (params) => {
  const query = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      if (Array.isArray(params[key])) {
        params[key].forEach(item => query.append(key, item));
      } else {
        query.append(key, params[key]);
      }
    }
  }
  return query.toString() ? `?${query.toString()}` : '';
};