# Meta Comment → Private Reply

Vercel + TypeScript + Supabase backend for a simple interaction: a user comments a number on an eligible Facebook Page or Instagram post, the webhook resolves that post to an active campaign, and the service sends the configured private reply through Meta's official APIs.

## Stack
- Vercel Functions using Web `Request`/`Response`
- Node.js 22+ / TypeScript strict mode
- Supabase Postgres for campaigns, responses and durable idempotency
- Vitest
- Official Meta APIs only

## Setup
1. `npm install`
2. `cp .env.example .env.local`
3. Create a Supabase project and run `supabase/migrations/001_initial.sql`.
4. Insert a `response_sets` row, its numbered `responses`, and a campaign containing the exact Facebook post ID and/or Instagram media ID.
5. Configure your Meta app webhook callback as `https://YOUR_PROJECT.vercel.app/api/webhook` and use the same value as `META_VERIFY_TOKEN` when Meta asks for the verify token.
6. Configure the required Meta webhook subscriptions and permissions for your Page/Instagram professional account according to the current official Meta documentation.
7. `npm run check && npm run dev`.
8. Add all `.env.example` keys as Vercel Environment Variables and deploy.

## Security
POST webhooks are accepted only when `X-Hub-Signature-256` validates against `META_APP_SECRET`. Tokens and the Supabase service-role key are server-only. Never expose them to frontend code. Webhook deduplication is persisted in Postgres, not Vercel process memory.

## Campaign model
Infrastructure is content-agnostic. A campaign links a Facebook post ID and/or Instagram media ID to a response set. A response set contains `selection -> message`. Tarot can therefore be one response set while later campaigns such as *Mensajes del Universo* use the same code.

## Important Meta note
Meta APIs, permissions and messaging restrictions are versioned and change over time. Keep `META_GRAPH_VERSION` explicit and verify the current official Meta documentation before enabling production traffic or changing platform adapters. The Instagram adapter is intentionally isolated for that reason.

## Vercel note
The handlers are short-lived API work and do not rely on persistent local state. External Meta calls use timeouts. Vercel currently supports Web-standard Request/Response functions; Node runtime/version should also be kept aligned with Vercel's supported production runtimes.

## Codex / agent development
Read `AGENTS.md` before changing code. It is the workspace contract for architecture, security, testing, Meta API verification, Vercel constraints and definition of done.

## Commands
```bash
npm install
npm run typecheck
npm test
npm run check
npm run dev
```

## Production checklist
- Meta app in the appropriate production/live state and required review completed where applicable.
- Correct Page / Instagram professional account connected.
- Current permissions and webhook fields verified in official Meta docs.
- Production tokens stored only in Vercel environment variables.
- Supabase migration applied; RLS enabled; service-role key server-only.
- At least one active campaign and response set configured.
- Test comments confirm exactly one private reply even when a webhook is replayed.
- Logs contain no secrets.
