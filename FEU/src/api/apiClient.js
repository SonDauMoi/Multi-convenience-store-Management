import axios from "axios";
import { API_BASE_URL } from "./constant";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//Interceptor để gắn accessToken vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Nếu dữ liệu là FormData, để trình duyệt tự set Content-Type (kèm boundary)
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"]; // tránh ghi đè boundary
        delete config.headers["content-type"]; // dự phòng trường hợp key lowercase
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//Interceptor để xử lý 401 và refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/refresh-token`,
          {
            refreshToken,
          }
        );

        if (refreshResponse.status === 200) {
          const data = refreshResponse.data;
          localStorage.setItem("accessToken", data.token);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }

          // gắn lại token mới rồi gọi lại request cũ
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
