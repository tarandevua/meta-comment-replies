import { db } from "../lib/db.js";
import type { CommentEvent } from "../types.js";

export async function claimEvent(e: CommentEvent): Promise<boolean> {
  const { data, error } = await db().rpc("claim_processed_event", {
    p_event_id: e.eventId,
    p_platform: e.platform,
    p_comment_id: e.commentId,
    p_post_id: e.postId,
  });
  if (error) throw error;
  return data;
}
export async function finishEvent(
  eventId: string,
  status: "sent" | "ignored" | "failed",
  errorMessage?: string,
): Promise<void> {
  const { error } = await db()
    .from("processed_events")
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (error) throw error;
}
