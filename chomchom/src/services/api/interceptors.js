import { axiosInstance } from './axios';

let requestInterceptorId;
let responseInterceptorId;

export function setupInterceptors({ getToken, onUnauthorized } = {}) {
  if (requestInterceptorId !== undefined) {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
  }
  if (responseInterceptorId !== undefined) {
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  }

  requestInterceptorId = axiosInstance.interceptors.request.use((config) => {
    if (!config?.requiresAuth) return config;

    const token = getToken?.();

    if (!token) {
      console.warn(`[API] Missing auth token for: ${config.url}`);
      return config;
    }

    config.headers = config.headers || {};
    const authHeader = `Bearer ${token}`;

    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', authHeader);
    } else {
      config.headers.Authorization = authHeader;
    }

    return config;
  });

  responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        onUnauthorized?.();
      }
      return Promise.reject(error);
    }
  );

  return () => {
    if (requestInterceptorId !== undefined) {
      axiosInstance.interceptors.request.eject(requestInterceptorId);
      requestInterceptorId = undefined;
    }
    if (responseInterceptorId !== undefined) {
      axiosInstance.interceptors.response.eject(responseInterceptorId);
      responseInterceptorId = undefined;
    }
  };
}
