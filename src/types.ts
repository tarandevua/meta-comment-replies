export type Platform = "facebook" | "instagram";
export interface CommentEvent { platform: Platform; eventId: string; commentId: string; postId: string; text: string; }
