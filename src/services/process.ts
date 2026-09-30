import type { CommentEvent, IgnoredReason } from "../types.js";
import { parseSelection } from "../parser.js";
import { claimEvent, finishEvent } from "./idempotency.js";
import { findResponseMessage, resolveActiveCampaign } from "./campaigns.js";
import { sendFacebookPrivateReply } from "../platforms/facebook.js";
import { sendInstagramPrivateReply } from "../platforms/instagram.js";

async function ignore(eventId: string, reason: IgnoredReason): Promise<void> {
  await finishEvent(eventId, "ignored", { reason });
}

function sanitizedFailure(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  return raw
    .replace(/Bearer\s+[^\s]+/giu, "Bearer [redacted]")
    .replace(/(token|secret|authorization|apikey)\s*[=:]\s*[^\s,;]+/giu, "$1=[redacted]")
    .slice(0, 500);
}

export async function processComment(event: CommentEvent): Promise<void> {
  const campaign = await resolveActiveCampaign(event.platform, event.postId);
  if (!(await claimEvent(event, campaign?.id ?? null))) return;

  try {
    if (!campaign) {
      await ignore(event.eventId, "campaign_not_found");
      return;
    }

    const parsed = parseSelection(campaign.selectionType, event.text);
    if (parsed.status === "invalid") {
      await ignore(event.eventId, parsed.reason);
      return;
    }

    const message = await findResponseMessage(campaign.responseSetId, parsed.selection);
    if (!message) {
      await ignore(event.eventId, "selection_not_found");
      return;
    }

    if (event.platform === "facebook") {
      await sendFacebookPrivateReply(event.commentId, message);
    } else {
      await sendInstagramPrivateReply(event.commentId, message);
    }
    await finishEvent(event.eventId, "sent");
  } catch (error) {
    await finishEvent(event.eventId, "failed", { errorMessage: sanitizedFailure(error) });
    throw error;
  }
}
