import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./config";
import { navigationRef } from "./navigationRef";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-Client-Type": "mobile", // Добавляем заголовок глобально для всех запросов
  },
});

// Добавляем токен в каждый запрос
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Логика обновления токена (остаётся без изменений)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = await AsyncStorage.getItem("refresh_token");
        if (!refresh) {
          navigationRef.current?.reset({ index: 0, routes: [{ name: "Login" }] });
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${BASE_URL}/token/refresh/`,
          { refresh },
          { headers: { "X-Client-Type": "mobile" } } // Убедимся, что заголовок есть
        );

        await AsyncStorage.setItem("access_token", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (err) {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        navigationRef.current?.reset({ index: 0, routes: [{ name: "Login" }] });
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;