import axios from "axios";
import { DEV } from "./constants";
import { getToken, clearToken } from "./token";
import { refreshAccessToken } from "./auth";
import { toast } from "react-toastify";

// CREATE INSTANCE FIRST
const axiosInstance = axios.create({
  baseURL: DEV,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !String(originalRequest.url || "").includes("auth/refresh")
    ) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${token}`,
        };
        return axiosInstance(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      clearToken();
      if (
        typeof window !== "undefined" &&
        !error.config?.suppressAuthRedirect
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

const reportError = (err) => {
  const message =
    err?.response?.data?.error?.description ||
    err?.response?.data?.message ||
    err?.message ||
    "Request failed";
  if (typeof window !== "undefined") {
    toast.error(message);
  } else {
    console.error(message);
  }
};

const normalizeRequestOptions = (options) => {
  return options && typeof options === "object" && !Array.isArray(options)
    ? options
    : {};
};

const buildRequestConfig = (config = {}, options = {}) => {
  const normalizedOptions = normalizeRequestOptions(options);
  return {
    ...config,
    suppressAuthRedirect: Boolean(normalizedOptions.suppressAuthRedirect),
  };
};

const shouldReportError = (err, options) => {
  const normalizedOptions = normalizeRequestOptions(options);
  if (normalizedOptions.silent) {
    return false;
  }

  const status = err?.response?.status;
  if (
    status &&
    Array.isArray(normalizedOptions.suppressErrorStatuses) &&
    normalizedOptions.suppressErrorStatuses.includes(status)
  ) {
    return false;
  }

  return true;
};

export const getService = async (url, config = {}, options = {}) => {
  try {
    return await axiosInstance.get(url, buildRequestConfig(config, options));
  } catch (err) {
    if (shouldReportError(err, options)) {
      reportError(err);
    }
    return null;
  }
};

export const postService = async (url, data, options = {}) => {
  try {
    return await axiosInstance.post(
      url,
      data,
      buildRequestConfig({}, options),
    );
  } catch (err) {
    if (shouldReportError(err, options)) {
      reportError(err);
    }
    return null;
  }
};

export const putService = async (url, data, headers = {}, options = {}) => {
  try {
    return await axiosInstance.put(
      url,
      data,
      buildRequestConfig({ headers }, options),
    );
  } catch (err) {
    if (shouldReportError(err, options)) {
      reportError(err);
    }
    return null;
  }
};

export const patchService = async (url, data, options = {}) => {
  try {
    return await axiosInstance.patch(
      url,
      data,
      buildRequestConfig({}, options),
    );
  } catch (err) {
    if (shouldReportError(err, options)) {
      reportError(err);
    }
    return null;
  }
};

export const deleteService = async (url, options = {}) => {
  try {
    return await axiosInstance.delete(url, buildRequestConfig({}, options));
  } catch (err) {
    if (shouldReportError(err, options)) {
      reportError(err);
    }
    return null;
  }
};


