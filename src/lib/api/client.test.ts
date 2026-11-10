import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_URL, ApiError } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GoRequest API client", () => {
  it("restores the cookie session after returning from GitHub", async () => {
    const user = { id: 1, email: "you@example.com" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ user }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.me()).resolves.toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/auth/me`,
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("preserves upstream errors as completed requests and repeated response headers", async () => {
    const result = {
      status_code: 404,
      status: "404 Not Found",
      headers: { "Set-Cookie": ["a=1", "b=2"] },
      body: "missing",
      size_bytes: 7,
      duration_ms: 15,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(result)));
    await expect(
      api.execute({ method: "GET", url: "https://example.com" }),
    ).resolves.toEqual(result);
  });

  it("handles the empty logout response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/auth/logout`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("sends requests without requiring a signed-in user", async () => {
    const result = {
      status_code: 200,
      status: "200 OK",
      headers: {},
      body: "ok",
      size_bytes: 2,
      duration_ms: 15,
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { method: "GET" as const, url: "https://example.com" };
    await expect(api.execute(payload)).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/requests/execute`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("exposes API authentication errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "Session expired" }, { status: 401 }),
        ),
    );
    await expect(api.me()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Session expired",
    });
  });

  it("preserves rate limit retry information", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "Too many attempts" },
            { status: 429, headers: { "Retry-After": "60" } },
          ),
        ),
    );
    await expect(api.me()).rejects.toMatchObject({
      status: 429,
      retryAfter: "60",
    });
  });

  it("provides a fallback for non-JSON server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );
    await expect(api.health()).rejects.toMatchObject({
      status: 502,
      message: "Request failed (502).",
    });
  });

  it("reports network failures and preserves cancellation", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.health()).rejects.toBeInstanceOf(ApiError);
    await expect(api.health()).rejects.toMatchObject({ name: "AbortError" });
  });
});
