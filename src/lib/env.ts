import { z } from "zod";
const schema = z.object({
  META_VERIFY_TOKEN: z.string().min(16), META_APP_SECRET: z.string().min(1),
  META_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/),
  FACEBOOK_PAGE_ID: z.string().optional(), FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_ACCOUNT_ID: z.string().optional(), INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});
export function env() { return schema.parse(process.env); }
