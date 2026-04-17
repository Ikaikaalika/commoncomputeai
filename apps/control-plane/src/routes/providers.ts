import { Hono } from "hono";
import { z } from "zod";
import { ProviderCapabilitySchema } from "@commoncompute/contracts";
import { parseJson } from "../lib/http";
import { requireAuth } from "../lib/auth-middleware";
import { issueJwt } from "../lib/jwt";
import { writeAuditLog } from "../lib/audit";
import { getProviderSnapshot } from "../lib/db";
import type { AppContext } from "../types/app";

const OnboardSchema = z.object({
  display_name: z.string().min(2),
  jurisdiction: z.string().min(2).default("US"),
  price_per_gpu_hour_usd: z.number().positive().default(1.5)
});

const KycSchema = z.object({
  legal_name: z.string().min(2),
  country: z.string().min(2),
  document_ref: z.string().min(5)
});

const CapabilityUpsertSchema = ProviderCapabilitySchema.omit({
  provider_id: true
});

const HeartbeatSchema = z.object({
  status: z.enum(["online", "draining", "offline"]).default("online"),
  latency_score: z.number().min(0).max(1).optional(),
  uptime_score: z.number().min(0).max(1).optional()
});

async function resolveProviderIdByUserId(db: D1Database, userId: string): Promise<string | null> {
  const row = await db.prepare("SELECT id FROM providers WHERE user_id = ?1").bind(userId).first<{ id: string }>();
  return row?.id ?? null;
}

export function registerProviderRoutes(app: Hono<AppContext>): void {
  app.post("/v1/providers/onboard", requireAuth(["customer", "provider", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, OnboardSchema);
    if (!parsed.ok) return parsed.response;

    const auth = c.get("auth");
    const existingProviderId = await resolveProviderIdByUserId(c.env.DB, auth.sub);

    if (existingProviderId) {
      const token = await issueJwt(
        {
          sub: auth.sub,
          role: "provider",
          provider_id: existingProviderId
        },
        c.env.JWT_ISSUER,
        c.env.JWT_SECRET
      );

      return c.json({ provider_id: existingProviderId, kyc_status: "pending", token, already_exists: true });
    }

    const providerId = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO providers (
        id,
        user_id,
        display_name,
        jurisdiction,
        status,
        kyc_status,
        reliability_score,
        uptime_score,
        latency_score,
        price_per_gpu_hour_usd,
        created_at,
        updated_at
      ) VALUES (?1, ?2, ?3, ?4, 'offline', 'pending', 0.75, 0.8, 0.8, ?5, datetime('now'), datetime('now'))`
    )
      .bind(providerId, auth.sub, parsed.data.display_name, parsed.data.jurisdiction, parsed.data.price_per_gpu_hour_usd)
      .run();

    await c.env.DB.prepare("UPDATE users SET role = 'provider', updated_at = datetime('now') WHERE id = ?1").bind(auth.sub).run();

    await c.env.DB.prepare(
      `INSERT INTO compliance_events (id, provider_id, event_type, event_json, created_at)
       VALUES (?1, ?2, 'provider_onboarded', ?3, datetime('now'))`
    )
      .bind(crypto.randomUUID(), providerId, JSON.stringify(parsed.data))
      .run();

    await writeAuditLog(c.env, "user", auth.sub, "provider.onboard", "provider", providerId, parsed.data);

    const token = await issueJwt(
      {
        sub: auth.sub,
        role: "provider",
        provider_id: providerId
      },
      c.env.JWT_ISSUER,
      c.env.JWT_SECRET
    );

    return c.json({
      provider_id: providerId,
      kyc_status: "pending",
      token
    });
  });

  app.post("/v1/providers/kyc/submit", requireAuth(["provider", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, KycSchema);
    if (!parsed.ok) return parsed.response;

    const auth = c.get("auth");
    const providerId = auth.provider_id ?? (await resolveProviderIdByUserId(c.env.DB, auth.sub));
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE providers
        SET kyc_status = 'verified',
            kyc_verified_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?1`
    )
      .bind(providerId)
      .run();

    await c.env.DB.prepare(
      `INSERT INTO compliance_events (id, provider_id, event_type, event_json, created_at)
       VALUES (?1, ?2, 'kyc_verified', ?3, datetime('now'))`
    )
      .bind(crypto.randomUUID(), providerId, JSON.stringify(parsed.data))
      .run();

    await writeAuditLog(c.env, "provider", providerId, "provider.kyc.submit", "provider", providerId, {
      legal_name: parsed.data.legal_name,
      country: parsed.data.country
    });

    return c.json({ provider_id: providerId, kyc_status: "verified" });
  });

  app.post("/v1/providers/capabilities", requireAuth(["provider", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, CapabilityUpsertSchema);
    if (!parsed.ok) return parsed.response;

    const auth = c.get("auth");
    const providerId = auth.provider_id ?? (await resolveProviderIdByUserId(c.env.DB, auth.sub));
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    await c.env.DB.prepare(
      `INSERT INTO provider_capabilities (
        id,
        provider_id,
        os,
        adapter,
        gpu_count,
        gpu_model,
        vram_gb,
        driver_version,
        runtime_version,
        benchmark_score,
        attestation_hash,
        reliability_score,
        updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, datetime('now'))
      ON CONFLICT(provider_id) DO UPDATE SET
        os = excluded.os,
        adapter = excluded.adapter,
        gpu_count = excluded.gpu_count,
        gpu_model = excluded.gpu_model,
        vram_gb = excluded.vram_gb,
        driver_version = excluded.driver_version,
        runtime_version = excluded.runtime_version,
        benchmark_score = excluded.benchmark_score,
        attestation_hash = excluded.attestation_hash,
        reliability_score = excluded.reliability_score,
        updated_at = datetime('now')`
    )
      .bind(
        crypto.randomUUID(),
        providerId,
        parsed.data.os,
        parsed.data.adapter,
        parsed.data.gpu_count,
        parsed.data.gpu_model,
        parsed.data.vram_gb,
        parsed.data.driver_version,
        parsed.data.runtime_version,
        parsed.data.benchmark_score,
        parsed.data.attestation_hash,
        parsed.data.reliability_score
      )
      .run();

    const snapshot = await getProviderSnapshot(c.env, providerId);
    if (snapshot) {
      const marketStub = c.env.MARKET_DO.get(c.env.MARKET_DO.idFromName("global"));
      await marketStub.fetch("https://market-do/providers/register", {
        method: "POST",
        body: JSON.stringify({ provider: snapshot })
      });
    }

    await c.env.PROVIDER_EVENTS.send({
      channel: "provider-events",
      type: "provider_registered",
      provider_id: providerId
    });

    await writeAuditLog(c.env, "provider", providerId, "provider.capabilities.upsert", "provider", providerId, {
      adapter: parsed.data.adapter,
      model: parsed.data.gpu_model,
      vram_gb: parsed.data.vram_gb,
      gpu_count: parsed.data.gpu_count
    });

    return c.json({ provider_id: providerId, updated: true });
  });

  app.post("/v1/providers/heartbeat", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, HeartbeatSchema);
    if (!parsed.ok) return parsed.response;

    const auth = c.get("auth");
    const providerId = auth.provider_id ?? (await resolveProviderIdByUserId(c.env.DB, auth.sub));
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE providers
        SET status = ?2,
            last_heartbeat_at = datetime('now'),
            latency_score = COALESCE(?3, latency_score),
            uptime_score = COALESCE(?4, uptime_score),
            updated_at = datetime('now')
      WHERE id = ?1`
    )
      .bind(providerId, parsed.data.status, parsed.data.latency_score ?? null, parsed.data.uptime_score ?? null)
      .run();

    const providerStub = c.env.PROVIDER_DO.get(c.env.PROVIDER_DO.idFromName(providerId));
    await providerStub.fetch("https://provider-do/heartbeat", {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId })
    });

    const snapshot = await getProviderSnapshot(c.env, providerId);
    if (snapshot) {
      const marketStub = c.env.MARKET_DO.get(c.env.MARKET_DO.idFromName("global"));
      await marketStub.fetch("https://market-do/providers/register", {
        method: "POST",
        body: JSON.stringify({ provider: snapshot })
      });
    }

    await c.env.PROVIDER_EVENTS.send({
      channel: "provider-events",
      type: parsed.data.status === "offline" ? "provider_offline" : "provider_heartbeat",
      provider_id: providerId
    });

    return c.json({ provider_id: providerId, status: parsed.data.status, heartbeat_at: new Date().toISOString() });
  });

  app.get("/v1/providers/earnings", requireAuth(["provider", "admin"]), async (c) => {
    const auth = c.get("auth");
    const providerId = auth.provider_id ?? (await resolveProviderIdByUserId(c.env.DB, auth.sub));
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const totals = await c.env.DB.prepare(
      `SELECT
        COALESCE(SUM(amount_usd), 0) AS total,
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount_usd ELSE 0 END), 0) AS held,
        COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) AS available,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd ELSE 0 END), 0) AS paid
      FROM payout_ledger
      WHERE provider_id = ?1`
    )
      .bind(providerId)
      .first<{ total: number; held: number; available: number; paid: number }>();

    return c.json({
      provider_id: providerId,
      earnings: {
        total_usd: Number(totals?.total ?? 0),
        held_usd: Number(totals?.held ?? 0),
        available_usd: Number(totals?.available ?? 0),
        paid_usd: Number(totals?.paid ?? 0)
      }
    });
  });
}
