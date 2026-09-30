import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendFacebookPrivateReply } from "../src/platforms/facebook.js";
import { sendInstagramPrivateReply } from "../src/platforms/instagram.js";

describe("Meta platform adapters", () => {
  beforeEach(() => {
    vi.stubEnv("META_VERIFY_TOKEN", "long-test-verify-token");
    vi.stubEnv("META_APP_SECRET", "test-app-secret");
    vi.stubEnv("META_GRAPH_VERSION", "v99.0");
    vi.stubEnv("FACEBOOK_PAGE_ID", "page-1");
    vi.stubEnv("FACEBOOK_PAGE_ACCESS_TOKEN", "facebook-token");
    vi.stubEnv("INSTAGRAM_ACCESS_TOKEN", "instagram-token");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("constructs the Facebook private-reply request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendFacebookPrivateReply("comment-1", "Your message");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v99.0/page-1/messages?");
    expect(JSON.parse(String(init.body))).toEqual({
      recipient: { comment_id: "comment-1" },
      message: { text: "Your message" },
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("propagates a bounded Facebook API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("temporary", { status: 503 })));
    await expect(sendFacebookPrivateReply("comment-1", "Your message"))
      .rejects.toThrow("Facebook API 503: temporary");
  });

  it("constructs the Instagram private-reply request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendInstagramPrivateReply("comment-2", "Your message");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v99.0/comment-2/private_replies");
    expect(init.headers).toMatchObject({ authorization: "Bearer instagram-token" });
    expect(JSON.parse(String(init.body))).toEqual({ message: "Your message" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("propagates a network timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));
    await expect(sendInstagramPrivateReply("comment-2", "Your message"))
      .rejects.toMatchObject({ name: "TimeoutError" });
  });
});
