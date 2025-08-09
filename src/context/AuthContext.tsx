import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [regToken, setRegToken] = useState(null);
  const [logToken, setLogToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // При старте проверяем токены
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        setIsAuthenticated(!!refresh);
        console.log("Auth check:", !!refresh);
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };
    checkAuth();
  }, []);

  // 📌 Регистрация
  const register = async (email, username, navigation) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/registration/`, { email, username });
      setRegToken(data.reg_token);
      navigation.navigate("RegisterCode");
    } catch (err) {
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Проверка кода регистрации
  const verifyCode = async (code, navigation) => {
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/registration/verification/`, {
        code,
        reg_token: regToken,
      });
      navigation.navigate("RegisterPassword");
    } catch (err) {
      console.error("VerifyCode error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Установка пароля
  const setPasswordFunc = async (password, password2) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${BASE_URL}/registration/password-set/`,
        { password, password2, reg_token: regToken },
        { headers: { "X-Client-Type": "mobile" } }
      );
      await AsyncStorage.setItem("access_token", data.access_token);
      await AsyncStorage.setItem("refresh_token", data.refresh_token);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("SetPassword error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Логин
  const login = async (username, password, navigation) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/login/`, { username, password });
      setLogToken(data.login_token);
      navigation.navigate("LoginCode");
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Проверка кода логина
  const loginCode = async (code) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${BASE_URL}/login/verification/`,
        { code, login_token: logToken },
        { headers: { "X-Client-Type": "mobile" } }
      );
      await AsyncStorage.setItem("access_token", data.access_token);
      await AsyncStorage.setItem("refresh_token", data.refresh_token);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("LoginCode error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 Выход
  const logout = async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        register,
        verifyCode,
        setPasswordFunc,
        regToken,
        isLoading,
        logout,
        isAuthenticated,
        setIsAuthenticated,
        login,
        loginCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
