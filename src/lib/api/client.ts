import type { ExecuteRequest, ExecuteResponse, User } from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");
export const GITHUB_SIGN_IN_URL = `${API_URL}/auth/github`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach GoRequest API. Check that the server is running and the frontend origin is allowed.",
      0,
    );
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status}).`;
    throw new ApiError(
      message,
      response.status,
      response.headers.get("Retry-After"),
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  health: (signal?: AbortSignal) =>
    request<{ status: string }>("/health", { signal }),
  me: (signal?: AbortSignal) => request<{ user: User }>("/auth/me", { signal }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  execute: (payload: ExecuteRequest, signal?: AbortSignal) =>
    request<ExecuteResponse>("/requests/execute", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    }),
};
