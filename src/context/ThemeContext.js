// src/context/ThemeContext.js

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const lightColors = {
  mode: "light", background: "#fafafa", card: "#ffffff", text: "#222222",
  subtext: "#666666", primary: "#c0392b", border: "#dddddd",
};

const darkColors = {
  mode: "dark", background: "#121212", card: "#1e1e1e", text: "#f0f0f0",
  subtext: "#aaaaaa", primary: "#e74c3c", border: "#333333",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const colors = useMemo(() => (theme === "light" ? lightColors : darkColors), [theme]);
  const value = { theme, isDark: theme === "dark", colors, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return ctx;
}