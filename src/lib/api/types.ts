export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface User {
  id: number;
  email: string;
}

export interface ExecuteRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout_ms?: number;
}

export interface ExecuteResponse {
  status_code: number;
  status: string;
  headers: Record<string, string[]>;
  body: string;
  size_bytes: number;
  duration_ms: number;
}
