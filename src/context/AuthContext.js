// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

// Server sends { id, name, email, role }. The app also uses fullName.
function toAppUser(u) {
  return { id: u.id, fullName: u.name, name: u.name, email: u.email, role: u.role };
}

async function saveSession(token, user) {
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // On app start: load the saved user so they stay logged in
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const saved = await AsyncStorage.getItem("user");
        if (token && saved) setCurrentUser(JSON.parse(saved));
      } catch (e) {
        // ignore, user will just log in again
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      const user = toAppUser(data.user);
      await saveSession(data.token, user);
      setAuthError(null);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message);
      return null;
    }
  }, []);

  const signup = useCallback(async ({ fullName, email, password, role }) => {
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: { fullName, email: email.trim(), password, role },
      });
      const user = toAppUser(data.user);
      await saveSession(data.token, user);
      setAuthError(null);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message);
      if (/already registered/i.test(err.message)) throw new Error("EMAIL_EXISTS");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setCurrentUser(null);
  }, []);

  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    isRestoring,
    authError,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}