import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimEvent: vi.fn(),
  finishEvent: vi.fn(),
  resolveResponse: vi.fn(),
  sendFacebookPrivateReply: vi.fn(),
  sendInstagramPrivateReply: vi.fn(),
}));

vi.mock("../src/services/idempotency.js", () => ({
  claimEvent: mocks.claimEvent,
  finishEvent: mocks.finishEvent,
}));
vi.mock("../src/services/campaigns.js", () => ({ resolveResponse: mocks.resolveResponse }));
vi.mock("../src/platforms/facebook.js", () => ({ sendFacebookPrivateReply: mocks.sendFacebookPrivateReply }));
vi.mock("../src/platforms/instagram.js", () => ({ sendInstagramPrivateReply: mocks.sendInstagramPrivateReply }));

import { processComment } from "../src/services/process.js";

const event = {
  platform: "facebook" as const,
  eventId: "facebook:comment-1",
  commentId: "comment-1",
  postId: "post-1",
  text: "7",
};

describe("processComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.finishEvent.mockResolvedValue(undefined);
  });

  it("does not dispatch a duplicate event", async () => {
    mocks.claimEvent.mockResolvedValue(false);
    await processComment(event);
    expect(mocks.resolveResponse).not.toHaveBeenCalled();
    expect(mocks.sendFacebookPrivateReply).not.toHaveBeenCalled();
  });

  it("records a dispatch failure and makes the webhook attempt fail", async () => {
    mocks.claimEvent.mockResolvedValue(true);
    mocks.resolveResponse.mockResolvedValue("Your message");
    mocks.sendFacebookPrivateReply.mockRejectedValue(new Error("Meta 503"));

    await expect(processComment(event)).rejects.toThrow("Meta 503");
    expect(mocks.finishEvent).toHaveBeenCalledWith(event.eventId, "failed", "Meta 503");
  });

  it("records unmapped selections as ignored", async () => {
    mocks.claimEvent.mockResolvedValue(true);
    mocks.resolveResponse.mockResolvedValue(null);
    await processComment(event);
    expect(mocks.finishEvent).toHaveBeenCalledWith(event.eventId, "ignored");
    expect(mocks.sendFacebookPrivateReply).not.toHaveBeenCalled();
  });
});
