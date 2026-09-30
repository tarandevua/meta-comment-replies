import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimEvent: vi.fn(),
  finishEvent: vi.fn(),
  resolveActiveCampaign: vi.fn(),
  findResponseMessage: vi.fn(),
  sendFacebookPrivateReply: vi.fn(),
  sendInstagramPrivateReply: vi.fn(),
}));

vi.mock("../src/services/idempotency.js", () => ({
  claimEvent: mocks.claimEvent,
  finishEvent: mocks.finishEvent,
}));
vi.mock("../src/services/campaigns.js", () => ({
  resolveActiveCampaign: mocks.resolveActiveCampaign,
  findResponseMessage: mocks.findResponseMessage,
}));
vi.mock("../src/platforms/facebook.js", () => ({
  sendFacebookPrivateReply: mocks.sendFacebookPrivateReply,
}));
vi.mock("../src/platforms/instagram.js", () => ({
  sendInstagramPrivateReply: mocks.sendInstagramPrivateReply,
}));

import { processComment } from "../src/services/process.js";

const facebookEvent = {
  platform: "facebook" as const,
  eventId: "facebook:comment-1",
  commentId: "comment-1",
  postId: "post-1",
  text: "7",
};

const campaign = {
  id: "campaign-1",
  responseSetId: "response-set-1",
  selectionType: "number" as const,
};

describe("processComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveActiveCampaign.mockResolvedValue(campaign);
    mocks.claimEvent.mockResolvedValue(true);
    mocks.finishEvent.mockResolvedValue(undefined);
    mocks.findResponseMessage.mockResolvedValue("Your message");
    mocks.sendFacebookPrivateReply.mockResolvedValue(undefined);
    mocks.sendInstagramPrivateReply.mockResolvedValue(undefined);
  });

  it("does not dispatch a duplicate event", async () => {
    mocks.claimEvent.mockResolvedValue(false);
    await processComment(facebookEvent);
    expect(mocks.findResponseMessage).not.toHaveBeenCalled();
    expect(mocks.sendFacebookPrivateReply).not.toHaveBeenCalled();
  });

  it("records a campaign miss without dispatching", async () => {
    mocks.resolveActiveCampaign.mockResolvedValue(null);
    await processComment(facebookEvent);
    expect(mocks.claimEvent).toHaveBeenCalledWith(facebookEvent, null);
    expect(mocks.finishEvent).toHaveBeenCalledWith(
      facebookEvent.eventId,
      "ignored",
      { reason: "campaign_not_found" },
    );
  });

  it("records a comment without a selection as ignored", async () => {
    await processComment({ ...facebookEvent, text: "Hola" });
    expect(mocks.finishEvent).toHaveBeenCalledWith(
      facebookEvent.eventId,
      "ignored",
      { reason: "no_selection" },
    );
    expect(mocks.findResponseMessage).not.toHaveBeenCalled();
  });

  it("records an ambiguous selection as ignored", async () => {
    await processComment({ ...facebookEvent, text: "7 o 12" });
    expect(mocks.finishEvent).toHaveBeenCalledWith(
      facebookEvent.eventId,
      "ignored",
      { reason: "ambiguous_selection" },
    );
  });

  it("records a selection absent from the response set as ignored", async () => {
    mocks.findResponseMessage.mockResolvedValue(null);
    await processComment({ ...facebookEvent, text: "999" });
    expect(mocks.findResponseMessage).toHaveBeenCalledWith("response-set-1", 999);
    expect(mocks.finishEvent).toHaveBeenCalledWith(
      facebookEvent.eventId,
      "ignored",
      { reason: "selection_not_found" },
    );
  });

  it("delivers a matching Facebook response", async () => {
    await processComment(facebookEvent);
    expect(mocks.resolveActiveCampaign).toHaveBeenCalledWith("facebook", "post-1");
    expect(mocks.sendFacebookPrivateReply).toHaveBeenCalledWith("comment-1", "Your message");
    expect(mocks.finishEvent).toHaveBeenCalledWith(facebookEvent.eventId, "sent");
  });

  it("delivers a matching Instagram response", async () => {
    const event = {
      ...facebookEvent,
      platform: "instagram" as const,
      eventId: "instagram:comment-2",
      commentId: "comment-2",
      postId: "media-1",
    };
    await processComment(event);
    expect(mocks.resolveActiveCampaign).toHaveBeenCalledWith("instagram", "media-1");
    expect(mocks.sendInstagramPrivateReply).toHaveBeenCalledWith("comment-2", "Your message");
    expect(mocks.sendFacebookPrivateReply).not.toHaveBeenCalled();
  });

  it("records a sanitized delivery failure and makes the webhook attempt fail", async () => {
    mocks.sendFacebookPrivateReply.mockRejectedValue(
      new Error("authorization=Bearer-secret Meta 503"),
    );

    await expect(processComment(facebookEvent)).rejects.toThrow("Meta 503");
    expect(mocks.finishEvent).toHaveBeenCalledWith(facebookEvent.eventId, "failed", {
      errorMessage: "Error: authorization=[redacted] Meta 503",
    });
  });
});
