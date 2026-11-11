import axios, { type InternalAxiosRequestConfig } from "axios";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiUrl = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  : "/api";

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshRequest: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;

    const request = error.config as RetryableRequest | undefined;
    const requestUrl = request?.url ?? "";
    const shouldSkipRefresh = ["/auth/login", "/auth/setup-owner", "/auth/refresh"].some(
      (path) => requestUrl.includes(path),
    );

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      shouldSkipRefresh
    ) {
      throw error;
    }

    request._retry = true;
    refreshRequest ??= api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });

    try {
      await refreshRequest;
      return await api(request);
    } catch (refreshError) {
      window.dispatchEvent(new Event("session:expired"));
      throw refreshError;
    }
  },
);

export async function getData<T>(path: string): Promise<T> {
  const response = await api.get<{ data: T }>(path);
  return response.data.data;
}