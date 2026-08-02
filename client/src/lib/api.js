import axios from 'axios';

// Use a relative API base in production so the built frontend can be served by the same Express app.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5000')
).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving cookies (JWTs)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag to prevent infinite retry loops and keep track of refresh token state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor for auto-refreshing sessions
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the response is 401 (Unauthorized) and has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we are already refreshing, push this request to the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[API Client] Access token expired. Attempting token rotation...');
        // Call the refresh endpoint
        await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        console.log('[API Client] Token rotation succeeded. Retrying request...');
        isRefreshing = false;
        processQueue(null);
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API Client] Session expired. Redirecting to login...', refreshError.message);
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Clear auth state in window if available (will be caught by AuthContext)
        if (window.__clearAuthState) {
          window.__clearAuthState();
        }
        
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
