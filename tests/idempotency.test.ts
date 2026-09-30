import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), update: vi.fn(), eq: vi.fn() }));

vi.mock("../src/lib/db.js", () => ({
  db: () => ({
    rpc: mocks.rpc,
    from: () => ({ update: mocks.update }),
  }),
}));

import { claimEvent, finishEvent } from "../src/services/idempotency.js";

const event = {
  platform: "facebook" as const,
  eventId: "facebook:comment-1",
  commentId: "comment-1",
  postId: "post-1",
  text: "7",
};

describe("event idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });

  it("claims through the atomic database function", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(claimEvent(event, "campaign-1")).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("claim_processed_event", {
      p_event_id: event.eventId,
      p_platform: event.platform,
      p_comment_id: event.commentId,
      p_post_id: event.postId,
      p_campaign_id: "campaign-1",
    });
  });

  it("propagates state-transition failures", async () => {
    mocks.eq.mockResolvedValue({ error: new Error("database unavailable") });
    await expect(finishEvent(event.eventId, "sent")).rejects.toThrow("database unavailable");
  });
});
