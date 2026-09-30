# AGENTS.md — Meta Comment Private Replies

## Mission
Maintain a production-oriented, generic social-comment-to-private-response engine. It receives Facebook Page and Instagram professional-account comment webhooks, resolves an active campaign, deterministically maps a selection to campaign content, and sends the supported private reply through Meta's official APIs.

Tarot is only one possible campaign/response set. Campaigns, post/media identifiers, response sets and messages belong in Supabase rows, never hardcoded application source.

## Non-negotiable rules
- Use only official Meta Graph/Messenger/Instagram APIs. Never add scraping, Playwright/Selenium login automation, unofficial Instagram libraries, session cookies, passwords, or stored user credentials.
- Before changing a Meta endpoint, permission, webhook field, messaging window, API version, or review requirement, verify current official Meta documentation. Meta behavior is an external contract and can change.
- `META_GRAPH_VERSION` is configuration. Do not silently bump it.
- Vercel compute is stateless for correctness purposes. Never use global Maps/Sets, local files, or process memory for durable deduplication/state.
- Supabase/Postgres is the source of truth for campaigns, responses and webhook idempotency.
- Supabase access must remain strongly typed with `createClient<Database>()`. Keep database types synchronized with migrations; never use `any`, `@ts-ignore` or unsafe casts to hide schema drift.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, Meta access tokens, or app secret to client code, logs, tests, commits, error responses, or fixtures.
- Treat webhook payloads and comment text as untrusted input.
- Verify `X-Hub-Signature-256` against the raw request body before parsing/processing POST webhooks.
- Webhook retries must be idempotent. `processed_events.event_id` is the durable uniqueness boundary.
- Migrations are the database source of truth and must remain forward-only. Regenerate/review `src/types/database.ts` after schema changes.
- NodeNext relative imports include explicit runtime `.js` extensions.

## Architecture
`Meta webhook -> api/webhook.ts -> signature verification -> normalization -> campaign resolution -> durable event claim -> selection parser -> exact response lookup -> platform adapter -> Meta API`.

Keep Meta payload parsing out of campaign/business logic. Selection parsing is deterministic and strategy-based; it must not use an LLM or guess intent. The response rows in a campaign's response set define valid selections—never hardcode Tarot ranges or duplicate min/max configuration. Invalid or ambiguous comments are silently ignored by default.

## Repository map
- `api/` Vercel Web Request/Response handlers only; keep thin.
- `src/platforms/` external Meta API adapters. Platform-specific behavior stays here.
- `src/services/` application orchestration and persistence workflows.
- `src/lib/` environment, DB and security helpers.
- `supabase/migrations/` forward-only schema migrations.
- `tests/` unit/integration tests that never call production Meta endpoints.

## Local workflow
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill local/test credentials.
3. Apply SQL migrations to a development Supabase project.
4. `npm run check`
5. `npm run dev`

Before finishing a code change, run `npm run check`.

## Coding conventions
- TypeScript strict mode; prefer small typed functions and explicit return types at boundaries.
- Node.js 24 ESM/NodeNext is the runtime target. Relative TypeScript imports must use `.js`; package imports remain unchanged.
- Web-standard `Request`/`Response` for Vercel handlers.
- Validate environment/config at runtime; fail clearly on missing server configuration.
- External `fetch` calls need finite timeouts and checked HTTP status.
- Do not log access tokens or full external API error bodies. Redact sensitive data and bound log/error sizes.
- Avoid `any`; the webhook normalizer is the deliberate boundary where loosely typed external payloads are narrowed.
- Keep platform API calls isolated so Facebook and Instagram can evolve independently.

## Database and concurrency
- Use database uniqueness/transactions for correctness under concurrent webhook delivery.
- Never implement check-then-insert deduplication in application memory.
- Event claims are atomic and insert-only. Do not automatically retry an uncertain external send unless a design prevents duplicate private replies.
- Migrations are additive/forward-only unless a destructive change is explicitly requested.
- RLS remains enabled. The service role is server-only.

## Meta behavior
Facebook and Instagram private replies have platform-specific permissions and policy limits. Do not infer one platform's rules from the other. Confirm official docs before production setup and whenever errors suggest an API contract changed.

The Instagram adapter is intentionally isolated and carries a verification comment: re-check its current endpoint, required permissions, account type and messaging limits against official Meta docs before enabling production traffic.

## Webhook behavior
- GET performs Meta verification using `META_VERIFY_TOKEN`.
- POST authenticates the raw body before JSON parsing.
- Normalize only recognized comment events.
- Unknown/irrelevant events should be harmless.
- Duplicate events should not send duplicate messages.
- A comment that does not map to an active campaign/selection should be recorded as ignored, not treated as an application failure.
- Ignored events use structured reasons: `campaign_not_found`, `no_selection`, `ambiguous_selection`, or `selection_not_found`.
- Invalid comments receive no DM or public reply and do not invoke an LLM.

## Tests
Add tests for every parser/normalizer bug and important policy branch. Mock Meta and Supabase at unit-test boundaries. Tests and CI must never contact real Meta APIs or use production tokens. Critical scenarios: valid/invalid signatures, duplicate events, malformed payloads, irrelevant events, active/inactive/missing campaigns, valid/ambiguous/missing selections, unmapped responses, Meta 4xx/5xx/timeouts, and concurrent duplicate delivery.

## Definition of done
A change is done when: TypeScript passes; tests pass; no secret is committed/logged; webhook retry behavior remains idempotent; external requests have timeouts; new configuration is documented; schema changes have migrations; Meta contract changes cite/reflect current official docs in README/implementation notes; and architecture/setup changes update this file or README where appropriate.

## Preferred next steps
1. Add realistic fixture-based webhook normalization tests from sanitized Meta payloads.
2. Verify and configure current Meta App permissions/subscriptions for both platforms.
3. Add an admin-safe way to create campaigns/response sets without redeploying.
4. Add structured observability and a retry strategy for transient Meta failures without risking duplicate sends.
5. Add CI for `npm run check`.
