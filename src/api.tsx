import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./config";
import { navigationRef } from "./navigationRef";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "X-Client-Type": "mobile",
  },
});

// Логирование запросов
api.interceptors.request.use(async (config) => {
  console.log('[API REQUEST]', {
    url: `${config.baseURL}${config.url}`,
    method: config.method,
    headers: config.headers,
    data: config.data,
  });

  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('[API REQUEST ERROR]', error);
  return Promise.reject(error);
});

// Логирование ответов и обработка ошибок
api.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE SUCCESS]', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Логирование ошибки
    if (error.response) {
      console.error('[API RESPONSE ERROR]', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: originalRequest.url,
          method: originalRequest.method,
        },
      });
    } else {
      console.error('[API NETWORK ERROR]', error);
    }

    // Обработка 401 ошибки (refresh token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('[TOKEN REFRESH] Attempting token refresh...');
        const refresh = await AsyncStorage.getItem("refresh_token");
        
        if (!refresh) {
          console.log('[TOKEN REFRESH] No refresh token available');
          navigationRef.current?.reset({ index: 0, routes: [{ name: "Login" }] });
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${BASE_URL}/token/refresh/`,
          { refresh },
          { headers: { "X-Client-Type": "mobile" } }
        );

        console.log('[TOKEN REFRESH] Successfully refreshed tokens');
        await AsyncStorage.setItem("access_token", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        
        return api(originalRequest);
      } catch (err) {
        console.error('[TOKEN REFRESH ERROR]', err);
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
        navigationRef.current?.reset({ index: 0, routes: [{ name: "Login" }] });
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;