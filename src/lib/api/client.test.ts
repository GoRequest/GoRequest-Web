import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_URL, ApiError } from "./client";

afterEach(() => { vi.unstubAllGlobals(); });

describe("GoRequest API client", () => {
  it("includes session cookies and JSON headers when signing in", async () => {
    const user = { id: 1, email: "you@example.com" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ user }));
    vi.stubGlobal("fetch", fetchMock);
    const credentials = { email: user.email, password: "a long unique password" };
    await expect(api.login(credentials)).resolves.toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/auth/login`, expect.objectContaining({
      method: "POST", credentials: "include", cache: "no-store",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials),
    }));
  });

  it("preserves upstream errors as completed requests and repeated response headers", async () => {
    const result = { status_code: 404, status: "404 Not Found", headers: { "Set-Cookie": ["a=1", "b=2"] }, body: "missing", size_bytes: 7, duration_ms: 15 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(result)));
    await expect(api.execute({ method: "GET", url: "https://example.com" })).resolves.toEqual(result);
  });

  it("handles the empty logout response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api.logout()).resolves.toBeUndefined();
  });

  it("exposes API authentication errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Session expired" }, { status: 401 })));
    await expect(api.me()).rejects.toMatchObject({ name: "ApiError", status: 401, message: "Session expired" });
  });

  it("preserves rate limit retry information", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Too many attempts" }, { status: 429, headers: { "Retry-After": "60" } })));
    await expect(api.login({ email: "a@b.com", password: "password" })).rejects.toMatchObject({ status: 429, retryAfter: "60" });
  });

  it("provides a fallback for non-JSON server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    await expect(api.health()).rejects.toMatchObject({ status: 502, message: "Request failed (502)." });
  });

  it("reports network failures and preserves cancellation", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.health()).rejects.toBeInstanceOf(ApiError);
    await expect(api.health()).rejects.toMatchObject({ name: "AbortError" });
  });
});
