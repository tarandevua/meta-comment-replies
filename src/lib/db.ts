import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
let client: ReturnType<typeof createClient>|undefined;
export function db(){ const e=env(); return client ??= createClient(e.SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}); }
