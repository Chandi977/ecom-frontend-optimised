import axios from "axios";
import { DEV } from "./constants";
import { clearToken, getRefreshToken, getToken, setAuthState } from "./token";

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      `${DEV}auth/refresh`,
      { refreshToken },
      { withCredentials: true },
    );
    const data = res?.data?.data || {};
    const token = data.token || data.Token;
    const nextRefreshToken = data.refreshToken || data.RefreshToken;
    const user = data.user;

    if (!token || !nextRefreshToken) {
      clearToken();
      return null;
    }

    setAuthState(token, nextRefreshToken, user);
    return token;
  } catch {
    clearToken();
    return null;
  }
};

export const logout = async () => {
  const token = getToken();
  const refreshToken = getRefreshToken();

  try {
    if (token) {
      await axios.post(
        `${DEV}auth/logout`,
        { refreshToken },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    }
  } finally {
    clearToken();
  }
};
