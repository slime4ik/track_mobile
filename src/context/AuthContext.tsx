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
        console.log('[AUTH] Checking authentication status...');
        const refresh = await AsyncStorage.getItem("refresh_token");
        console.log('[AUTH] Refresh token exists:', !!refresh);
        setIsAuthenticated(!!refresh);
      } catch (err) {
        console.error('[AUTH CHECK ERROR]', err);
        setError(err);
      }
    };
    checkAuth();
  }, []);

  // Регистрация
  const register = async (email, username, navigation) => {
    setIsLoading(true);
    setError(null);
    console.log('[REGISTER] Starting registration process', { email, username });
    
    try {
      const { data } = await api.post("/registration/", { email, username });
      console.log('[REGISTER] Success response:', data);
      
      // Сохраняем токен в AsyncStorage для надежности
      await AsyncStorage.setItem('reg_token', data.reg_token);
      setRegToken(data.reg_token);
      
      navigation.navigate("RegisterCode");
    } catch (err) {
      const errorData = err.response?.data || err.message;
      console.error('[REGISTER ERROR]', {
        error: errorData,
        request: { email, username },
      });
      
      setError(errorData);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода регистрации
  const verifyCode = async (code, navigation) => {
    setIsLoading(true);
    setError(null);
    console.log('[VERIFY CODE] Verifying code', { code });
    
    try {
      // Получаем токен из AsyncStorage, если он потерялся в состоянии
      const token = regToken || await AsyncStorage.getItem('reg_token');
      if (!token) {
        throw new Error('Токен регистрации не найден');
      }
      
      const response = await api.post("/registration/verification/", { 
        code, 
        reg_token: token 
      });
      console.log('[VERIFY CODE] Success response:', response.data);
      
      navigation.navigate("RegisterPassword");
    } catch (err) {
      const errorData = err.response?.data || err.message;
      console.error('[VERIFY CODE ERROR]', {
        error: errorData,
        request: { code },
      });
      
      setError(errorData);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Установка пароля
  const setPasswordFunc = async (password, password2) => {
    setIsLoading(true);
    setError(null);
    console.log('[SET PASSWORD] Setting password');
    
    try {
      // Получаем токен из AsyncStorage, если он потерялся в состоянии
      const token = regToken || await AsyncStorage.getItem('reg_token');
      if (!token) {
        throw new Error('Токен регистрации не найден');
      }
      
      const { data } = await api.post("/registration/password-set/", {
        password,
        password2,
        reg_token: token
      });
      
      console.log('[SET PASSWORD] Success response:', data);
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      await AsyncStorage.removeItem('reg_token'); // Очищаем временный токен
      
      setIsAuthenticated(true);
    } catch (err) {
      const errorData = err.response?.data || err.message;
      console.error('[SET PASSWORD ERROR]', {
        error: errorData,
        request: { password, password2 },
      });
      
      setError(errorData);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Логин
  const login = async (username, password, navigation) => {
    setIsLoading(true);
    setError(null);
    console.log('[LOGIN] Starting login process', { username });
    
    try {
      const { data } = await api.post("/login/", { username, password });
      console.log('[LOGIN] Success response:', data);
      
      // Сохраняем токен в AsyncStorage для надежности
      await AsyncStorage.setItem('login_token', data.login_token);
      setLogToken(data.login_token);
      
      navigation.navigate("LoginCode");
    } catch (err) {
      const errorData = err.response?.data || err.message;
      console.error('[LOGIN ERROR]', {
        error: errorData,
        request: { username },
      });
      
      setError(errorData);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка кода логина
  const loginCode = async (code) => {
    setIsLoading(true);
    setError(null);
    console.log('[LOGIN CODE] Verifying login code', { code });
    
    try {
      // Получаем токен из AsyncStorage, если он потерялся в состоянии
      const token = logToken || await AsyncStorage.getItem('login_token');
      if (!token) {
        throw new Error('Токен логина не найден');
      }
      
      const { data } = await api.post("/login/verification/", {
        code,
        login_token: token
      });
      
      console.log('[LOGIN CODE] Success response:', data);
      await AsyncStorage.multiSet([
        ["access_token", data.access_token],
        ["refresh_token", data.refresh_token]
      ]);
      await AsyncStorage.removeItem('login_token'); // Очищаем временный токен
      
      setIsAuthenticated(true);
    } catch (err) {
      const errorData = err.response?.data || err.message;
      console.error('[LOGIN CODE ERROR]', {
        error: errorData,
        request: { code },
      });
      
      setError(errorData);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      console.log('[LOGOUT] Starting logout process');
      await AsyncStorage.multiRemove([
        "access_token", 
        "refresh_token",
        "reg_token",
        "login_token"
      ]);
      setIsAuthenticated(false);
      console.log('[LOGOUT] Successfully logged out');
    } catch (err) {
      console.error('[LOGOUT ERROR]', err);
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