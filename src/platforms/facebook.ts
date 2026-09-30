import { env } from "../lib/env.js";

export async function sendFacebookPrivateReply(
  commentId: string,
  message: string,
): Promise<void> {
  const e = env();
  if (!e.FACEBOOK_PAGE_ID || !e.FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error("Facebook credentials missing");
  }

  const response = await fetch(
    `https://graph.facebook.com/${e.META_GRAPH_VERSION}/${e.FACEBOOK_PAGE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${e.FACEBOOK_PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Facebook API request failed with status ${response.status}`);
  }
}
