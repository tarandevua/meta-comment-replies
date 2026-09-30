import { db } from "../lib/db.js";
import type { Campaign, Platform } from "../types.js";

export async function resolveActiveCampaign(
  platform: Platform,
  postId: string,
): Promise<Campaign | null> {
  const postColumn = platform === "facebook" ? "facebook_post_id" : "instagram_media_id";
  const { data, error } = await db()
    .from("campaigns")
    .select("id,response_set_id,response_sets!inner(selection_type)")
    .eq(postColumn, postId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    responseSetId: data.response_set_id,
    selectionType: data.response_sets.selection_type,
  };
}

export async function findResponseMessage(
  responseSetId: string,
  selection: number,
): Promise<string | null> {
  const { data, error } = await db()
    .from("responses")
    .select("message")
    .eq("response_set_id", responseSetId)
    .eq("selection", selection)
    .maybeSingle();

  if (error) throw error;
  return data?.message ?? null;
}
