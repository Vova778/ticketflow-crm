import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";
describe("API session handling", () => {
  const dispatchEvent = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", { getItem: () => "test-token" });
    vi.stubGlobal("window", { dispatchEvent });
    dispatchEvent.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());
  it("includes bearer token for protected requests", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await api("/tickets");
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-token",
    );
  });
  it("does not attach an old token on login", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await api("/auth/login", { public: true });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
  it("expires session on protected 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"message":"Expired"}', { status: 401 }),
        ),
    );
    await expect(api("/tickets")).rejects.toBeInstanceOf(ApiError);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
  it("keeps session on a 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"message":"Forbidden"}', { status: 403 }),
        ),
    );
    await expect(api("/users")).rejects.toThrow("Forbidden");
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
  it("shows validation messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            '{"message":["Title too short","Missing description"]}',
            { status: 400 },
          ),
        ),
    );
    await expect(api("/tickets")).rejects.toThrow(
      "Title too short. Missing description",
    );
  });
});
