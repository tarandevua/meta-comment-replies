import type { CommentEvent } from "./types.js";
export function normalizeWebhook(payload: unknown): CommentEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const p=payload as any; const platform: CommentEvent["platform"]|null = p.object === "instagram" ? "instagram" : p.object === "page" ? "facebook" : null;
  if (!platform || !Array.isArray(p.entry)) return [];
  const out: CommentEvent[]=[];
  for (const entry of p.entry) for (const change of entry.changes ?? []) {
    const v=change.value ?? {}; const text=v.text ?? v.message; const commentId=v.id ?? v.comment_id;
    const postId=v.media?.id ?? v.post_id ?? v.media_id;
    if (typeof text === "string" && commentId && postId) out.push({ platform, eventId:`${platform}:${commentId}`, commentId:String(commentId), postId:String(postId), text });
  }
  return out;
}
