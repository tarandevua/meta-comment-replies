import { db } from "../lib/db.js"; import type { CommentEvent } from "../types.js";
export async function claimEvent(e: CommentEvent): Promise<boolean> {
  const {error}=await db().from("processed_events").insert({event_id:e.eventId,platform:e.platform,comment_id:e.commentId,post_id:e.postId,status:"processing"});
  if(!error) return true; if((error as any).code === "23505") return false; throw error;
}
export async function finishEvent(eventId:string,status:"sent"|"ignored"|"failed",errorMessage?:string){
  await db().from("processed_events").update({status,error_message:errorMessage ?? null,processed_at:new Date().toISOString()}).eq("event_id",eventId);
}
