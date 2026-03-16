import React, { createContext, useContext } from 'react';

const TabNavigationContext = createContext(null);

export function TabNavigationProvider({ value, children }) {
  return <TabNavigationContext.Provider value={value}>{children}</TabNavigationContext.Provider>;
}

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}
