// AuthContext.tsx
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
        setError({
          message: "Ошибка проверки аутентификации",
          details: err.message
        });
      }
    };
    checkAuth();
  }, []);

  // Регистрация
  const register = async (email, username, navigation) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email || !username) {
        throw new Error("Email и имя пользователя обязательны");
      }

      const { data } = await api.post("/registration/", { email, username });
      
      await AsyncStorage.setItem('reg_token', data.reg_token);
      setRegToken(data.reg_token);
      
      navigation.navigate("RegisterCode");
    } catch (err) {
      const errorData = err.response?.data || {
        message: err.message,
        status: err.response?.status
      };
      
      setError({
        type: "register",
        ...errorData
      });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода регистрации
  const verifyCode = async (code, navigation) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!code || code.length !== 6) {
        throw new Error("Код должен содержать 6 цифр");
      }

      const token = regToken || await AsyncStorage.getItem('reg_token');
      if (!token) {
        throw new Error('Токен регистрации не найден');
      }
      
      await api.post("/registration/verification/", { 
        code, 
        reg_token: token 
      });
      
      navigation.navigate("RegisterPassword");
    } catch (err) {
      const errorData = err.response?.data || {
        message: err.message,
        status: err.response?.status
      };
      
      setError({
        type: "verifyCode",
        ...errorData
      });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Установка пароля
  const setPasswordFunc = async (password, password2) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!password || !password2) {
        throw new Error("Пароли обязательны");
      }
      
      if (password !== password2) {
        throw new Error("Пароли не совпадают");
      }

      const token = regToken || await AsyncStorage.getItem('reg_token');
      if (!token) {
        throw new Error('Токен регистрации не найден');
      }
      
      const { data } = await api.post("/registration/password-set/", {
        password,
        password2,
        reg_token: token
      });
      
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      await AsyncStorage.removeItem('reg_token');
      
      setIsAuthenticated(true);
    } catch (err) {
      const errorData = err.response?.data || {
        message: err.message,
        status: err.response?.status
      };
      
      setError({
        type: "setPassword",
        ...errorData
      });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Логин
  const login = async (username, password, navigation) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!username || !password) {
        throw new Error("Имя пользователя и пароль обязательны");
      }

      const { data } = await api.post("/login/", { username, password });
      
      await AsyncStorage.setItem('login_token', data.login_token);
      setLogToken(data.login_token);
      
      navigation.navigate("LoginCode");
    } catch (err) {
      const errorData = err.response?.data || {
        message: err.message,
        status: err.response?.status
      };
      
      setError({
        type: "login",
        ...errorData
      });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода логина
  const loginCode = async (code) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!code || code.length !== 6) {
        throw new Error("Код должен содержать 6 цифр");
      }

      const token = logToken || await AsyncStorage.getItem('login_token');
      if (!token) {
        throw new Error('Токен логина не найден');
      }
      
      const { data } = await api.post("/login/verification/", {
        code,
        login_token: token
      });
      
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      await AsyncStorage.removeItem('login_token');
      
      setIsAuthenticated(true);
    } catch (err) {
      const errorData = err.response?.data || {
        message: err.message,
        status: err.response?.status
      };
      
      setError({
        type: "loginCode",
        ...errorData
      });
      throw errorData;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "access_token", 
        "refresh_token",
        "reg_token",
        "login_token"
      ]);
      setIsAuthenticated(false);
    } catch (err) {
      setError({
        message: "Ошибка при выходе",
        details: err.message
      });
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