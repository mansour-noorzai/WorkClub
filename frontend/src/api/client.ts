import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { getApiUrl } from "../config";

const baseURL = getApiUrl();
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    if (error.response?.status !== 401 || !request || request._retried) {
      throw error;
    }

    request._retried = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    try {
      const token = await refreshPromise;
      request.headers.Authorization = `Bearer ${token}`;
      return api.request(request);
    } catch {
      setAccessToken(null);
      localStorage.removeItem("workclub_identity");
      throw error;
    }
  },
);

export async function refreshAccessToken(): Promise<string> {
  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true, headers: { "Content-Type": "application/json" } },
  );
  const token = response.data.result.accessToken;
  if (!token) throw new Error("The server did not return an access token.");
  setAccessToken(token);
  return token;
}

export async function publicPost<T>(path: string, data: unknown): Promise<T> {
  const response = await axios.post<T>(`${baseURL}${path}`, data, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  } satisfies AxiosRequestConfig);
  return response.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const details = error.response?.data?.details as
      | {
          fieldErrors?: Record<string, string[]>;
          formErrors?: string[];
        }
      | undefined;
    if (details?.fieldErrors) {
      const messages = Object.values(details.fieldErrors).flat();
      if (messages.length) return messages[0];
    }
    if (details?.formErrors?.length) return details.formErrors[0];
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
