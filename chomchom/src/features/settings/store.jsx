import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';
import { lightColors, darkColors } from '../../theme/palettes';

const STORAGE_THEME = '@settings/theme';
const STORAGE_LANGUAGE = '@settings/language';

const initialState = {
  theme: 'light',
  language: 'vi',
};

function settingsReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    default:
      return state;
  }
}

const defaultContextValue = {
  theme: 'light',
  language: 'vi',
  colors: lightColors,
  setTheme: () => {},
  setLanguage: () => {},
};

export const SettingsContext = createContext(defaultContextValue);

export function SettingsProvider({ children }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_THEME, STORAGE_LANGUAGE]).then((pairs) => {
      const theme = pairs[0][1] ?? 'light';
      const language = pairs[1][1] ?? 'vi';
      dispatch({ type: 'SET_THEME', payload: theme });
      dispatch({ type: 'SET_LANGUAGE', payload: language });
      i18n.changeLanguage(language);
    });
  }, []);

  const setTheme = (value) => {
    dispatch({ type: 'SET_THEME', payload: value });
    AsyncStorage.setItem(STORAGE_THEME, value);
  };

  const setLanguage = (value) => {
    dispatch({ type: 'SET_LANGUAGE', payload: value });
    AsyncStorage.setItem(STORAGE_LANGUAGE, value);
    i18n.changeLanguage(value);
  };

  const colors = state.theme === 'dark' ? darkColors : lightColors;

  return (
    <SettingsContext.Provider value={{ ...state, colors, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}
