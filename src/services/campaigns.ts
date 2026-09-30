import { db } from "../lib/db.js"; import type { Platform } from "../types.js";
export async function resolveResponse(platform: Platform, postId: string, selection: number): Promise<string|null> {
  const postColumn=platform === "facebook" ? "facebook_post_id" : "instagram_media_id";
  const {data:campaign,error}=await db().from("campaigns").select("response_set_id").eq(postColumn,postId).eq("status","active").maybeSingle();
  if(error) throw error; if(!campaign) return null;
  const {data,error:responseError}=await db().from("responses").select("message").eq("response_set_id",campaign.response_set_id).eq("selection",selection).maybeSingle();
  if(responseError) throw responseError; return data?.message ?? null;
}
