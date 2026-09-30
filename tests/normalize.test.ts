import { describe, expect, it } from "vitest";
import { normalizeWebhook } from "../src/normalize.js";

describe("normalizeWebhook", () => {
  it("normalizes a Facebook comment addition", () => {
    expect(normalizeWebhook({
      object: "page",
      entry: [{
        changes: [{
          field: "feed",
          value: {
            item: "comment",
            verb: "add",
            comment_id: "comment-1",
            post_id: "post-1",
            message: "7",
          },
        }],
      }],
    })).toEqual([{
      platform: "facebook",
      eventId: "facebook:comment-1",
      commentId: "comment-1",
      postId: "post-1",
      text: "7",
    }]);
  });

  it("normalizes an Instagram comment", () => {
    expect(normalizeWebhook({
      object: "instagram",
      entry: [{
        changes: [{
          field: "comments",
          value: { id: "comment-2", text: "3", media: { id: "media-1" } },
        }],
      }],
    })).toEqual([{
      platform: "instagram",
      eventId: "instagram:comment-2",
      commentId: "comment-2",
      postId: "media-1",
      text: "3",
    }]);
  });

  it("ignores malformed and unrelated changes without throwing", () => {
    expect(normalizeWebhook({
      object: "page",
      entry: [null, { changes: null }, { changes: [null, {
        field: "feed",
        value: { item: "post", post_id: "post-1", message: "7" },
      }] }],
    })).toEqual([]);
  });
});
