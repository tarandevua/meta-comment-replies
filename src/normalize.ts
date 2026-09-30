import type { CommentEvent } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

export function normalizeWebhook(payload: unknown): CommentEvent[] {
  if (!isRecord(payload)) return [];
  const platform: CommentEvent["platform"] | null =
    payload.object === "instagram"
      ? "instagram"
      : payload.object === "page"
        ? "facebook"
        : null;
  if (!platform || !Array.isArray(payload.entry)) return [];

  const out: CommentEvent[] = [];
  for (const entry of payload.entry) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isRecord(change) || !isRecord(change.value)) continue;
      if (platform === "facebook" && change.field !== undefined && change.field !== "feed") continue;
      if (platform === "instagram" && change.field !== undefined && change.field !== "comments") continue;

      const value = change.value;
      if (value.item !== undefined && value.item !== "comment") continue;
      if (value.verb !== undefined && value.verb !== "add") continue;

      const text = typeof value.text === "string" ? value.text : value.message;
      const commentId = optionalString(value.id ?? value.comment_id);
      const media = isRecord(value.media) ? value.media : null;
      const postId = optionalString(media?.id ?? value.post_id ?? value.media_id);
      if (typeof text !== "string" || !commentId || !postId) continue;

      out.push({
        platform,
        eventId: `${platform}:${commentId}`,
        commentId,
        postId,
        text,
      });
    }
  }
  return out;
}
