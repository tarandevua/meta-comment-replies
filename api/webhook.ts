import { env } from "../src/lib/env.js";
import { verifyMetaSignature } from "../src/lib/signature.js";
import { normalizeWebhook } from "../src/normalize.js";
import { processComment } from "../src/services/process.js";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env().META_VERIFY_TOKEN && challenge) {
    return new Response(challenge);
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env().META_APP_SECRET)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const events = normalizeWebhook(payload);
  const results = await Promise.allSettled(events.map(processComment));
  const failed = results.filter((result) => result.status === "rejected").length;
  return Response.json(
    { received: true, events: events.length, failed },
    { status: failed > 0 ? 500 : 200 },
  );
}
