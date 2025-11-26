import { jwtDecode } from "jwt-decode";

export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

/**
 * Kiểm tra token có hợp lệ hay không (chưa hết hạn)
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000); // giây
    return decoded.exp && decoded.exp > currentTime;
  } catch (err) {
    console.error("Invalid token:", err);
    return false;
  }
};

/**
 * Lấy payload (vd: user info, roles) từ token
 */
export const getTokenPayload = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    console.error("Cannot decode token:", err);
    return null;
  }
};

/**
 * Lấy user info từ access token
 * BEU JWT payload: { userId, username, role, name, storeId, iat, exp }
 */
export const getUserInfo = () => {
  const token = getAccessToken();
  if (!token) return null;
  const payload = getTokenPayload(token);
  if (!payload) return null;

  return {
    userId: payload.userId || payload.sub || null,
    username: payload.username || null,
    role: payload.role || null,
    name: payload.name || null,
    storeId: payload.storeId || null,
  };
};
