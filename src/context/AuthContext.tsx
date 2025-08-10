import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [regToken, setRegToken] = useState(null);
  const [logToken, setLogToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Проверка аутентификации при старте
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        setIsAuthenticated(!!refresh);
      } catch (err) {
        console.error("Auth check error:", err);
        setError(err);
      }
    };
    checkAuth();
  }, []);

  // Регистрация
  const register = async (email, username, navigation) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/registration/", { email, username });
      setRegToken(data.reg_token);
      navigation.navigate("RegisterCode");
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода регистрации
  const verifyCode = async (code, navigation) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/registration/verification/", { 
        code, 
        reg_token: regToken 
      });
      navigation.navigate("RegisterPassword");
    } catch (err) {
      console.error("VerifyCode error:", err);
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Установка пароля
  const setPasswordFunc = async (password, password2) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/registration/password-set/", {
        password,
        password2,
        reg_token: regToken
      });
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("SetPassword error:", err);
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Логин
  const login = async (username, password, navigation) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/login/", { username, password });
      setLogToken(data.login_token);
      navigation.navigate("LoginCode");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода логина
  const loginCode = async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/login/verification/", {
        code,
        login_token: logToken
      });
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("LoginCode error:", err);
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        register,
        verifyCode,
        setPasswordFunc,
        regToken,
        isLoading,
        error,
        logout,
        isAuthenticated,
        login,
        loginCode,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};