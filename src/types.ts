export type Platform = "facebook" | "instagram";
export type SelectionType = "number";
export type EventStatus = "processing" | "sent" | "ignored" | "failed";
export type IgnoredReason =
  | "no_selection"
  | "ambiguous_selection"
  | "selection_not_found"
  | "campaign_not_found";

export interface CommentEvent {
  platform: Platform;
  eventId: string;
  commentId: string;
  postId: string;
  text: string;
}

export interface Campaign {
  id: string;
  responseSetId: string;
  selectionType: SelectionType;
}
