import { env } from "../lib/env.js";

// Verified against Meta's Instagram Platform Private Replies guide for v26.0 on 2026-09-30.
export async function sendInstagramPrivateReply(
  commentId: string,
  message: string,
): Promise<void> {
  const e = env();
  if (!e.INSTAGRAM_ACCOUNT_ID || !e.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error("Instagram credentials missing");
  }

  const response = await fetch(
    `https://graph.facebook.com/${e.META_GRAPH_VERSION}/${e.INSTAGRAM_ACCOUNT_ID}/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${e.INSTAGRAM_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Instagram API request failed with status ${response.status}`);
  }
}
