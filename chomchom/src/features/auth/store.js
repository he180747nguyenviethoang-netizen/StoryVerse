import React, { createContext, useEffect, useRef, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { setupInterceptors } from '../../services/api/interceptors';

const AUTH_TOKEN_KEY = '@auth/token';
const AUTH_USER_KEY = '@auth/user';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isRestoring: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isRestoring: false,
      };
    case 'RESTORE_DONE':
      return { ...state, isRestoring: false };
    case 'LOGIN':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isRestoring: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return { ...initialState, isRestoring: false };
    default:
      return state;
  }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Keep a ref so the interceptor always reads the latest token
  // without needing to be re-registered on every token change.
  const tokenRef = useRef(state.token);
  useEffect(() => {
    tokenRef.current = state.token;
  }, [state.token]);

  // Restore session from storage on mount.
  useEffect(() => {
    async function restoreSession() {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (token && userJson) {
          dispatch({ type: 'RESTORE_SESSION', payload: { token, user: JSON.parse(userJson) } });
        } else {
          dispatch({ type: 'RESTORE_DONE' });
        }
      } catch {
        dispatch({ type: 'RESTORE_DONE' });
      }
    }
    restoreSession();
  }, []);

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  };

  // Register the interceptor ONCE on mount only.
  useEffect(() => {
    const cleanup = setupInterceptors({
      getToken: () => tokenRef.current,
      onUnauthorized: logout,
    });
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (user, token) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
      dispatch({ type: 'LOGIN', payload: { user, token } });
    } catch {
      console.error('Failed to save auth data');
    }

  };

  const updateCurrentUser = async (nextUser) => {
    try {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      dispatch({ type: 'UPDATE_USER', payload: nextUser });
    } catch {
      console.error('Failed to update auth user');
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}
