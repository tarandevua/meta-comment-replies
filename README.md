# Social Comment → Private Response

A generic Vercel service that maps comments on configured Facebook Page and Instagram professional-account content to campaign responses, then sends the matching private reply through Meta's official APIs.

Tarot is one possible content set, not application logic. New campaigns and numbered response collections are database configuration and do not require a deployment.

## Architecture

```text
Facebook / Instagram
  → Meta webhook
  → Vercel Web Request handler
  → signature verification on the raw body
  → normalized CommentEvent
  → active campaign lookup
  → atomic processed-event claim
  → deterministic selection parser
  → exact Supabase response lookup
  → Facebook or Instagram adapter
  → official Meta private-reply API
```

The webhook handler and Meta payload normalizer do not know about campaign content. Platform-specific API calls live in separate adapters. Supabase/Postgres is the source of truth for configuration and idempotency; Vercel process memory is never used for correctness.

## Database concepts

- `response_sets` is a reusable collection with a `selection_type`. The only current strategy is `number`.
- `responses` maps one exact integer selection to a title and message inside a response set. `(response_set_id, selection)` is unique, and the rows themselves define which selections are valid.
- `campaigns` links one response set to a Facebook post ID, an Instagram media ID, or both. Only `active` campaigns resolve.
- `processed_events` records the normalized event, resolved campaign when known, lifecycle (`processing`, `sent`, `ignored`, or `failed`), structured ignored reason, and timestamps. Its primary key and `(platform, comment_id)` unique index are durable duplicate-delivery boundaries.

There is deliberately no minimum or maximum selection in application code or duplicated campaign configuration. A response set may contain `1–8`, `1–22`, sparse values such as `2, 7, 40`, or another integer set.

For example:

```text
Instagram Reel A
  → campaign "Tarot October"
  → response set "Classic Tarot"
  → comment "7"
  → response #7 (Tarot message)

Instagram Reel B
  → campaign "Universe October"
  → response set "Universe Messages"
  → comment "7"
  → response #7 (completely different message)
```

## Comment behavior

The number parser is deterministic. `7`, `7 🔮`, `Carta 7`, `Mi número es 7 ❤️`, and `Elijo 17!` yield a numeric candidate. A candidate is valid only if an exact response row exists in the campaign's response set.

Comments with no number are ignored as `no_selection`; comments with different numbers such as `7 o 12` are ignored as `ambiguous_selection`; absent response rows are `selection_not_found`; and posts without an active campaign are `campaign_not_found`. Ignored comments receive no private message or public reply, and no LLM is called.

The database claim is atomic and insert-only. Concurrent or repeated webhook deliveries cannot acquire the same event/comment claim. A failed or uncertain Meta send is recorded as `failed` and is not automatically replayed, because blindly retrying an uncertain external side effect can send a duplicate. Investigate and retry such events manually only after confirming delivery state.

## Requirements and local development

- Node.js 24 (`.nvmrc`)
- A Supabase project
- A Meta app configured for the relevant Facebook Page and/or Instagram professional account

```bash
nvm use
npm install
cp .env.example .env.local
# Apply every supabase/migrations/*.sql file in filename order.
npm run check
npm run dev
```

Create response sets, responses, and campaigns in Supabase. Do not place post IDs or campaign messages in source code.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `META_VERIFY_TOKEN` | Long random value shared with Meta webhook verification |
| `META_APP_SECRET` | Verifies `X-Hub-Signature-256` on raw webhook bodies |
| `META_GRAPH_VERSION` | Explicit configured Graph API version; never silently bumped |
| `FACEBOOK_PAGE_ID` | Page used by the Facebook private-reply adapter |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Server-only Page access token |
| `INSTAGRAM_ACCOUNT_ID` | Instagram professional account used by its adapter |
| `INSTAGRAM_ACCESS_TOKEN` | Server-only token for Instagram messaging |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database key; never expose to client code |

Facebook variables are required only when processing Facebook campaigns; Instagram variables are required only when processing Instagram campaigns. All core webhook and Supabase variables are required at runtime.

## Migrations and generated types

Migrations are forward-only and are the database source of truth. Apply all files in `supabase/migrations/` in order to development, staging, and production. Migration `003_generic_campaign_engine.sql` adds selection strategy metadata, update timestamps, campaign/reason event data, lookup/idempotency indexes, and the insert-only atomic claim function.

`src/types/database.ts` currently mirrors the migrations. Regenerate it after every schema change using the Supabase CLI (the CLI need not be a project dependency):

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/database.ts
```

Review the generated diff before committing it.

## Testing

```bash
npm run typecheck
npm test
npm audit
# typecheck + tests
npm run check
```

Tests mock Supabase and `fetch`; they never call production Meta endpoints. Add a regression test for every parser/normalizer bug and policy branch.

## Vercel deployment

1. Import the repository into Vercel and use Node.js 24.
2. Add the environment variables above to the appropriate Vercel environments.
3. Apply all Supabase migrations before directing production webhooks to the deployment.
4. Deploy and use `https://YOUR_PROJECT.vercel.app/api/webhook` as the callback URL.
5. Verify `/api/health`, complete Meta's webhook challenge, then test one configured campaign on each enabled platform.

Vercel functions are stateless and external Meta requests have a ten-second timeout. Do not add filesystem or process-memory persistence.

## Meta setup and contract

Configure the app, required review, account/Page connection, access tokens, and webhook subscriptions using current official Meta documentation. Subscribe Facebook Page feed comment events and Instagram `comments` events as applicable. The verification token entered in Meta must match `META_VERIFY_TOKEN`.

The isolated adapters were last verified for the configured v26.0 contract on 2026-09-30:

- Facebook private replies: `POST /{PAGE_ID}/messages`, Page access token, and the required `pages_messaging` permission: [Meta Facebook Private Replies](https://developers.facebook.com/documentation/business-messaging/messenger-platform/discovery/private-replies)
- Instagram private replies with Facebook Login: `POST /{INSTAGRAM_ACCOUNT_ID}/messages` with `recipient.comment_id`: [Meta Instagram Private Replies](https://developers.facebook.com/documentation/instagram-platform/private-replies)

Meta endpoints, permissions, webhook fields, app-review requirements, and messaging windows change. Re-verify the official documentation before production enablement, when changing `META_GRAPH_VERSION`, or when platform errors suggest the contract changed. Never use scraping, browser login automation, cookies, passwords, or unofficial APIs.

## Production checklist

- Meta app is in the appropriate live state and required review is complete.
- Page and/or Instagram professional account is connected and subscribed.
- Current permissions, webhook fields, endpoints, and messaging limits are verified.
- Secrets exist only in Supabase/Vercel server-side configuration and are absent from logs and commits.
- Every migration is applied and RLS remains enabled.
- At least one response set, its responses, and an active campaign are configured.
- Replayed and concurrently delivered test webhooks produce at most one private reply.
- Failed/uncertain deliveries have an explicit manual-review procedure.

Read `AGENTS.md` before changing the service.
