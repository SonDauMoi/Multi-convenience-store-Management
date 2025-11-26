import axios from "axios";
import { API_BASE_URL } from "./constant";
import axiosInstance from "../utils/axiosInstance";
import { saveTokens, clearTokens, getRefreshToken } from "../utils/jwt-helper";

// Login API - BEU expects { username, password }
export const loginAPI = async (body) => {
  const url = API_BASE_URL + "/login";

  try {
    const response = await axios.post(url, body);
    const { token, refreshToken } = response.data;
    saveTokens(token, refreshToken);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register API - BEU expects { username, email, password, name, phone }
export const registerAPI = (body) =>
  axios.post(`${API_BASE_URL}/register`, body).then((res) => res.data);

// Verify email API
export const verifyAPI = (body) =>
  axios.post(`${API_BASE_URL}/verify`, body).then((res) => res.data);

// Resend verification OTP
export const resendVerificationAPI = (email) =>
  axios
    .post(`${API_BASE_URL}/resend-verification`, { email })
    .then((res) => res.data);

// Get user profile
export const getProfileAPI = () => axiosInstance.get("/user/profile");

// Logout API
export const logoutAPI = async () => {
  try {
    const refreshToken = getRefreshToken();
    await axiosInstance.post("/logout", {
      refreshToken,
    });
  } catch (err) {
    console.error("Logout API failed", err);
  } finally {
    clearTokens();
    window.location.href = "/";
  }
};

// Refresh token API
export const refreshTokenAPI = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const response = await axios.post(`${API_BASE_URL}/refresh-token`, {
    refreshToken,
  });

  const { token, refreshToken: newRefreshToken } = response.data;
  saveTokens(token, newRefreshToken);
  return token;
};
