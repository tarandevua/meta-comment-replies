import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("../src/lib/db.js", () => ({
  db: () => ({ from: mocks.from }),
}));

import { findResponseMessage, resolveActiveCampaign } from "../src/services/campaigns.js";

describe("campaign queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = {
      select: mocks.select,
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
    };
    mocks.from.mockReturnValue(query);
    mocks.select.mockReturnValue(query);
    mocks.eq.mockReturnValue(query);
  });

  it.each([
    ["facebook" as const, "facebook_post_id", "post-1"],
    ["instagram" as const, "instagram_media_id", "media-1"],
  ])("resolves an active %s campaign", async (platform, column, postId) => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: "campaign-1",
        response_set_id: "response-set-1",
        response_sets: { selection_type: "number" },
      },
      error: null,
    });

    await expect(resolveActiveCampaign(platform, postId)).resolves.toEqual({
      id: "campaign-1",
      responseSetId: "response-set-1",
      selectionType: "number",
    });
    expect(mocks.eq).toHaveBeenCalledWith(column, postId);
    expect(mocks.eq).toHaveBeenCalledWith("status", "active");
  });

  it("does not resolve a missing or inactive campaign", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(resolveActiveCampaign("facebook", "inactive-post")).resolves.toBeNull();
  });

  it("looks up only the exact selection in a response set", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { message: "Response 7" }, error: null });
    await expect(findResponseMessage("response-set-1", 7)).resolves.toBe("Response 7");
    expect(mocks.eq).toHaveBeenCalledWith("response_set_id", "response-set-1");
    expect(mocks.eq).toHaveBeenCalledWith("selection", 7);
  });

  it("returns null when the exact response is absent", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(findResponseMessage("response-set-1", 8)).resolves.toBeNull();
  });
});
