"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { getThemeCookie, setThemeCookie } from '../utils/cookies';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ตรวจสอบ theme จาก cookies เมื่อ mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = getThemeCookie();
      if (theme === 'dark') setIsDarkMode(true);
      else if (theme === 'light') setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      setThemeCookie(newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    if (typeof window !== 'undefined') {
      console.warn('useTheme must be used within a ThemeProvider! Returning default values.');
    }
    return {
      isDarkMode: false,
      toggleTheme: () => {},
    };
  }
  return context;
};
