const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'cinecast_access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (value) => { if (value) localStorage.setItem(TOKEN_KEY, value); };
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

let isRefreshing = false;
let refreshQueue = []; // callbacks waiting for new token

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  refreshQueue = [];
};

const attemptRefresh = async () => {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Refresh failed');
  const { access_token } = await res.json();
  setToken(access_token);
  return access_token;
};

export const request = async (path, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token && !(options.body instanceof FormData)) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  // Auto-refresh on 401 (skip auth endpoints to avoid infinite loops)
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    if (isRefreshing) {
      // Queue this request until refresh completes
      const newToken = await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers });
    } else {
      isRefreshing = true;
      try {
        const newToken = await attemptRefresh();
        processQueue(null, newToken);
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers });
      } catch (err) {
        processQueue(err);
        clearToken();
        window.dispatchEvent(new Event('cinecast:session-expired'));
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

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
    credentials: 'include',
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Upload failed');
  }
  return response.json();
};

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
