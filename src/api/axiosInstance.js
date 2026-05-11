/**
 * @module axiosInstance
 * @description Configured Axios instance with interceptors for JWT token management
 *              and automatic token refresh on 401 responses.
 */
import axios from 'axios';
import { message } from 'antd';

let store;
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

// Function to lazily import store to avoid circular dependencies
const getStore = async () => {
  if (!store) {
    const { store: importedStore } = await import('../store/index.js');
    store = importedStore;
  }
  return store;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(async (config) => {
  const storeInstance = await getStore();
  const token = storeInstance.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const storeInstance = await getStore();
        const authState = storeInstance.getState().auth;
        const refreshToken = authState.refreshToken;
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || '';

        if (
          original.url?.includes('/auth/impersonation/exchange') ||
          authState.user?.isImpersonated ||
          !refreshToken ||
          errorMessage.includes('Impersonation session')
        ) {
          const { logout } = await import('../store/authSlice.js');
          storeInstance.dispatch(logout());
          message.error(errorMessage || 'Impersonation session ended. Please log in again.');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { setTokens } = await import('../store/authSlice.js');
        storeInstance.dispatch(setTokens(response.data.data));

        original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return axiosInstance(original);
      } catch (err) {
        const storeInstance = await getStore();
        const { logout } = await import('../store/authSlice.js');
        storeInstance.dispatch(logout());
        message.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
