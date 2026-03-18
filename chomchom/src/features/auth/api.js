import { axiosInstance } from '../../services/api/axios';
import { endpoints } from '../../services/api/endpoints';

function extractToken(data) {
  return data?.token ?? data?.accessToken ?? data?.resetToken;
}

function extractUser(data) {
  return data?.user ?? data;
}

export const authApi = {
  /**
   * TODO: Replace with real API call
   * POST /auth/login
   */
  login: async (payload) => {
    const { data } = await axiosInstance.post(endpoints.auth.login, {
      email: payload.email,
      password: payload.password,
    });

    const user = {
      _id: data._id,
      username: data.username,
      email: data.email,
      role: data.role,
    };

    return { user, token: data.token };
  },

  /**
   * POST /api/auth/register
   * Body: { username, email, password }
   */
  register: async (payload) => {
    const { data } = await axiosInstance.post(endpoints.auth.register, {
      username: payload.username,
      email: payload.email,
      password: payload.password,
    });

    const user = {
      _id: data._id,
      username: data.username,
      email: data.email,
      role: data.role,
    };

    return { user, token: extractToken(data) };
  },

  verifyOtp: async (payload) => {
    const { data } = await axiosInstance.post(endpoints.auth.verify, {
      email: payload.email,
      code: payload.code,
      purpose: payload.purpose,
    });

    return {
      ...data,
      token: extractToken(data),
      user: extractUser(data),
    };
  },

  forgotPassword: async (payload) => {
    const { data } = await axiosInstance.post(endpoints.auth.forgotPassword, {
      email: payload.email,
    });
    return data;
  },

  resetPassword: async (payload) => {
    const { data } = await axiosInstance.post(endpoints.auth.resetPassword, {
      email: payload.email,
      newPassword: payload.newPassword,
      token: payload.token,
      code: payload.code,
    });
    return data;
  },

  /**
   * Post Google ID Token to backend
   * POST /api/auth/google
   */
  loginWithGoogle: async (idToken) => {
    const { data } = await axiosInstance.post(endpoints.auth.google, {
      idToken,
    });

    const user = {
      _id: data?.user?._id,
      username: data?.user?.username,
      email: data?.user?.email,
      role: data?.user?.role,
    };

    return { user, token: data?.accessToken };
  },

  logout: async () => {
    // No server endpoint — token is cleared locally by the auth store.
  },

  getUserById: async (userId) => {
    const { data } = await axiosInstance.get(`/api/users/${userId}`, {
      requiresAuth: true,
    });
    return data;
  },

  updateProfile: async (userId, payload) => {
    const { data } = await axiosInstance.put(`/api/users/${userId}`, payload, {
      requiresAuth: true,
    });
    return data;
  },

  changePassword: async (userId, payload) => {
    const { data } = await axiosInstance.put(`/api/users/${userId}/password`, payload, {
      requiresAuth: true,
    });
    return data;
  },
};
