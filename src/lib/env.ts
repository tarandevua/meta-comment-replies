import { z } from "zod";
const schema = z.object({
  META_VERIFY_TOKEN: z.string().min(16), META_APP_SECRET: z.string().min(1),
  META_GRAPH_VERSION: z.string().regex(/^v\d+\.\d+$/),
  FACEBOOK_PAGE_ID: z.string().optional(), FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  INSTAGRAM_ACCOUNT_ID: z.string().optional(), INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
}).superRefine((value, context) => {
  if (!value.INSTAGRAM_ENABLED) return;
  if (!value.INSTAGRAM_ACCOUNT_ID) {
    context.addIssue({
      code: "custom",
      path: ["INSTAGRAM_ACCOUNT_ID"],
      message: "Required when INSTAGRAM_ENABLED=true",
    });
  }
  if (!value.INSTAGRAM_ACCESS_TOKEN) {
    context.addIssue({
      code: "custom",
      path: ["INSTAGRAM_ACCESS_TOKEN"],
      message: "Required when INSTAGRAM_ENABLED=true",
    });
  }
});
export function env() { return schema.parse(process.env); }
