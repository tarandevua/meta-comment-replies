import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const processComment = vi.hoisted(() => vi.fn());
vi.mock("../src/services/process.js", () => ({ processComment }));

import { GET, POST } from "../api/webhook.js";

const payload = {
  object: "page",
  entry: [{ changes: [{
    field: "feed",
    value: {
      item: "comment",
      verb: "add",
      comment_id: "comment-1",
      post_id: "post-1",
      message: "7",
    },
  }] }],
};

function request(body: string, valid = true): Request {
  const signature = valid
    ? `sha256=${createHmac("sha256", "test-app-secret").update(body).digest("hex")}`
    : "sha256=invalid";
  return new Request("https://example.test/api/webhook", {
    method: "POST",
    body,
    headers: { "x-hub-signature-256": signature },
  });
}

describe("POST webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("META_VERIFY_TOKEN", "long-test-verify-token");
    vi.stubEnv("META_APP_SECRET", "test-app-secret");
    vi.stubEnv("META_GRAPH_VERSION", "v99.0");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  it("returns 200 after all events succeed", async () => {
    processComment.mockResolvedValue(undefined);
    const response = await POST(request(JSON.stringify(payload)));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, events: 1, failed: 0 });
  });

  it("returns 500 so Meta retries when an event fails", async () => {
    processComment.mockRejectedValue(new Error("temporary failure"));
    const response = await POST(request(JSON.stringify(payload)));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ received: true, events: 1, failed: 1 });
  });

  it("rejects an invalid signature before processing", async () => {
    const response = await POST(request(JSON.stringify(payload), false));
    expect(response.status).toBe(401);
    expect(processComment).not.toHaveBeenCalled();
  });

  it("rejects malformed signed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect(processComment).not.toHaveBeenCalled();
  });

  it("answers a valid webhook verification challenge", async () => {
    const url = new URL("https://example.test/api/webhook");
    url.searchParams.set("hub.mode", "subscribe");
    url.searchParams.set("hub.verify_token", "long-test-verify-token");
    url.searchParams.set("hub.challenge", "challenge-value");
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("challenge-value");
  });
});
