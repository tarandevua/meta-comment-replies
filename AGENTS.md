# AGENTS.md — Meta Comment Private Replies

## Mission
Maintain a production-oriented Vercel service that receives Facebook Page and Instagram professional-account comment webhooks, maps an allowed numeric selection to campaign content, and sends the supported private reply through Meta's official APIs.

## Non-negotiable rules
- Use only official Meta Graph/Messenger/Instagram APIs. Never add scraping, Playwright/Selenium login automation, unofficial Instagram libraries, session cookies, passwords, or stored user credentials.
- Before changing a Meta endpoint, permission, webhook field, messaging window, API version, or review requirement, verify current official Meta documentation. Meta behavior is an external contract and can change.
- `META_GRAPH_VERSION` is configuration. Do not silently bump it.
- Vercel compute is stateless for correctness purposes. Never use global Maps/Sets, local files, or process memory for durable deduplication/state.
- Supabase/Postgres is the source of truth for campaigns, responses and webhook idempotency.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, Meta access tokens, or app secret to client code, logs, tests, commits, error responses, or fixtures.
- Treat webhook payloads and comment text as untrusted input.
- Verify `X-Hub-Signature-256` against the raw request body before parsing/processing POST webhooks.
- Webhook retries must be idempotent. `processed_events.event_id` is the durable uniqueness boundary.

## Architecture
`Meta webhook -> api/webhook.ts -> signature verification -> normalization -> durable event claim -> campaign resolution -> selection parser -> platform adapter -> Meta API`.

Keep domain logic independent from Tarot. Tarot is only a campaign/content set. Future campaigns must normally be created with database rows, not code changes.

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
- Web-standard `Request`/`Response` for Vercel handlers.
- Validate environment/config at runtime; fail clearly on missing server configuration.
- External `fetch` calls need finite timeouts and checked HTTP status.
- Do not log access tokens or full external API error bodies. Redact sensitive data and bound log/error sizes.
- Avoid `any`; the webhook normalizer is the deliberate boundary where loosely typed external payloads are narrowed.
- Keep platform API calls isolated so Facebook and Instagram can evolve independently.

## Database and concurrency
- Use database uniqueness/transactions for correctness under concurrent webhook delivery.
- Never implement check-then-insert deduplication in application memory.
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

## Tests
Add tests for every parser/normalizer bug and important policy branch. Mock Meta and Supabase at unit-test boundaries. Never use real production tokens in CI. Critical scenarios: valid/invalid signatures, duplicate events, malformed payloads, irrelevant events, valid selections, unmapped selections, Meta 4xx/5xx/timeouts, and concurrent duplicate delivery.

## Definition of done
A change is done when: TypeScript passes; tests pass; no secret is committed/logged; webhook retry behavior remains idempotent; external requests have timeouts; new configuration is documented; schema changes have migrations; Meta contract changes cite/reflect current official docs in README/implementation notes; and architecture/setup changes update this file or README where appropriate.

## Preferred next steps
1. Add realistic fixture-based webhook normalization tests from sanitized Meta payloads.
2. Verify and configure current Meta App permissions/subscriptions for both platforms.
3. Add an admin-safe way to create campaigns/response sets without redeploying.
4. Add structured observability and a retry strategy for transient Meta failures without risking duplicate sends.
5. Add CI for `npm run check`.
