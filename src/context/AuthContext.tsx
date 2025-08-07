import React, { createContext, useState, useEffect } from "react";
import { BASE_URL } from "../config";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [regToken, setRegToken] = useState(null);
  const [logToken, setLogToken] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // проверяем токены при старте
    const checkAuth = async () => {
      const refresh = await AsyncStorage.getItem("refresh_token");
      setIsAuthenticated(!!refresh); // если refresh есть – считаем, что авторизован
    console.log('Auth state changed to:', isAuthenticated);
    };
    checkAuth();
  }, []);

  // 📌 1. Регистрация
  const register = (email, username, navigation) => {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/registration/`, { email, username })
      .then((res) => {
        let userInfo = res.data;
        console.log(userInfo);

        setRegToken(userInfo.reg_token);
        navigation.navigate("RegisterCode");
      })
      .catch((e) => {
        console.log(`register error ${e}`);
      })
      .finally(() => setIsLoading(false)); // ✅ гарантированно отключаем
  };

  // 📌 2. Проверка кода
  const verifyCode = (code, navigation) => {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/registration/verification/`, {
        code,
        reg_token: regToken,
      })
      .then((res) => {
        console.log(res.data);
        navigation.navigate("RegisterPassword");
      })
      .catch((e) => {
        console.log(`verifyCode error ${e}`);
      })
      .finally(() => setIsLoading(false)); // ✅
  };

  // 📌 3. Установка пароля
  const setPasswordFunc = (password, password2) => {
    setIsLoading(true);
    axios
      .post(
        `${BASE_URL}/registration/password-set/`,
        { password, password2, reg_token: regToken },
        { headers: { "X-Client-Type": "mobile" } }
      )
      .then((res) => {
        const { access_token, refresh_token } = res.data;
        console.log(res.data);
        AsyncStorage.setItem("access_token", access_token);
        AsyncStorage.setItem("refresh_token", refresh_token);
        setIsAuthenticated(true);
      })
      .catch((e) => {
        console.log(`setPassword error ${e}`);
      })
      .finally(() => setIsLoading(false)); // ✅
  };

  const login = (username, password, navigation) => {
    axios.post(`${BASE_URL}/login/`,
    { username, password }
    ).then((res) => {
      let userInfo = res.data
      console.log(userInfo);

      setLogToken(userInfo.login_token);
      navigation.navigate("LoginCode");
    })   
    .catch((e) => {
        console.log(`register error ${e}`);
      })
      .finally(() => setIsLoading(false)); // ✅ гарантированно отключаем
  }
  // Проверка кода
  const loginCode = (code) => {
    setIsLoading(true);
    axios
      .post(`${BASE_URL}/login/verification/`, {
        code,
        login_token: logToken,
      },{ headers: { "X-Client-Type": "mobile" } })
      .then((res) => {
        const { access_token, refresh_token } = res.data;
        console.log(res.data);
        AsyncStorage.setItem("access_token", access_token);
        AsyncStorage.setItem("refresh_token", refresh_token);
        setIsAuthenticated(true);
      })
      .catch((e) => {
        console.log(`verifyCode error ${e}`);
      })
      .finally(() => setIsLoading(false)); // ✅
  };
  const logout = async () => {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setIsAuthenticated(false); // Главное - меняем состояние
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
