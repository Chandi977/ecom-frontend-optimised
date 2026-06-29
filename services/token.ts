// token.js
export const AUTH_STATE_EVENT = "authStateChanged";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("PIToken");
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("PIRefreshToken");
};

export const setToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("PIToken", token);
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
};

export const setAuthState = (token, refreshToken, user) => {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("PIToken", token);
    }
    if (refreshToken) {
      localStorage.setItem("PIRefreshToken", refreshToken);
    }
    if (user) {
      localStorage.setItem("PIUser", JSON.stringify(user));
    }
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
};

export const setAuthTokens = (token, refreshToken) => {
  setAuthState(token, refreshToken, null);
};

export const clearToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("PIToken");
    localStorage.removeItem("PIRefreshToken");
    localStorage.removeItem("PIUser");
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
};
