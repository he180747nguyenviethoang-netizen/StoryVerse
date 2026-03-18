import { useContext } from 'react';
import { SettingsContext } from './store';

export const useSettings = () => useContext(SettingsContext);
