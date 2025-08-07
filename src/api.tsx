import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./config";
import { navigationRef } from './navigationRef';

const api = axios.create({
  baseURL: BASE_URL,
});

// ✅ access_token в каждый запрос
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Client-Type"] = "mobile";
  return config;
});

// ✅ refresh логика + redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        if (!refresh) {
          console.log("❌ Нет refresh_token – редиректим на Login");

          // 👉 кидаем юзера на Login и сбрасываем историю
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });

          return Promise.reject(error);
        }

        const res = await axios.post(
          `${BASE_URL}/token/refresh/`,
          {},
          {
            headers: {
              "X-Client-Type": "mobile",
              "X-Refresh-Token": refresh,
            },
          }
        );

        const newAccess = res.data.access;
        await AsyncStorage.setItem("access_token", newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (e) {
        console.log("❌ refresh умер, редиректим на Login");
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);

        // 👉 кидаем юзера на Login и сбрасываем стек
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });

        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
