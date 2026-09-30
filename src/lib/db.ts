import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.js";
import { env } from "./env.js";

let client: SupabaseClient<Database> | null = null;

export function db(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const e = env();
  const url = e.SUPABASE_URL;
  const serviceRoleKey = e.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  client = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}