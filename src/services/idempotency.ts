import { db } from "../lib/db.js";
import type { CommentEvent, EventStatus, IgnoredReason } from "../types.js";

export async function claimEvent(
  event: CommentEvent,
  campaignId: string | null,
): Promise<boolean> {
  const { data, error } = await db().rpc("claim_processed_event", {
    p_event_id: event.eventId,
    p_platform: event.platform,
    p_comment_id: event.commentId,
    p_post_id: event.postId,
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  return data;
}

export async function finishEvent(
  eventId: string,
  status: Exclude<EventStatus, "processing">,
  details: { reason?: IgnoredReason; errorMessage?: string } = {},
): Promise<void> {
  const { error } = await db()
    .from("processed_events")
    .update({
      status,
      reason: details.reason ?? null,
      error_message: details.errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (error) throw error;
}
