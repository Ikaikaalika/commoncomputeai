import { Hono } from "hono";
import { hmacSha256Hex } from "../lib/crypto";
import type { AppContext } from "../types/app";

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

function parseStripeSignature(header: string | undefined): { timestamp: string; signatures: string[] } | null {
  if (!header) return null;
  const chunks = header.split(",").map((chunk) => chunk.trim());
  const timestamp = chunks.find((chunk) => chunk.startsWith("t="))?.slice(2);
  const signatures = chunks.filter((chunk) => chunk.startsWith("v1=")).map((chunk) => chunk.slice(3));
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function verifyStripeWebhook(rawBody: string, signatureHeader: string | undefined, secret: string): Promise<boolean> {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) return false;

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expected = await hmacSha256Hex(signedPayload, secret);
  return parsed.signatures.some((candidate) => candidate === expected);
}

export function registerBillingRoutes(app: Hono<AppContext>): void {
  app.post("/v1/billing/webhook/stripe", async (c) => {
    const rawBody = await c.req.raw.text();
    const sigHeader = c.req.header("Stripe-Signature");

    const verified = await verifyStripeWebhook(rawBody, sigHeader, c.env.STRIPE_WEBHOOK_SECRET);
    if (!verified) {
      return c.json({ error: "Invalid Stripe signature", code: "INVALID_SIGNATURE" }, 400);
    }

    let event: StripeEvent;
    try {
      event = JSON.parse(rawBody) as StripeEvent;
    } catch {
      return c.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
    }

    const amountCents = Number((event.data.object.amount_due as number | undefined) ?? (event.data.object.amount as number | undefined) ?? 0);
    const amountUsd = amountCents / 100;

    await c.env.DB.prepare(
      `INSERT INTO invoices (
        id,
        customer_user_id,
        status,
        amount_usd,
        external_ref,
        created_at,
        updated_at
      ) VALUES (?1, NULL, ?2, ?3, ?4, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        amount_usd = excluded.amount_usd,
        updated_at = datetime('now')`
    )
      .bind(event.id, event.type, amountUsd, event.id)
      .run();

    await c.env.BILLING_EVENTS.send({
      channel: "billing-events",
      type: "invoice_settle"
    });

    return c.json({ received: true });
  });
}
