import { Hono } from "hono";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/password";
import { issueJwt } from "../lib/jwt";
import { parseJson } from "../lib/http";
import { verifyTurnstile } from "../lib/turnstile";
import { writeAuditLog } from "../lib/audit";
import type { AppContext } from "../types/app";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  turnstile_token: z.string().optional(),
  role: z.enum(["customer", "provider"]).default("customer")
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  turnstile_token: z.string().optional()
});

const BootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  turnstile_token: z.string().optional()
});

export function registerAuthRoutes(app: Hono<AppContext>): void {
  app.post("/v1/auth/signup", async (c) => {
    const parsed = await parseJson(c.req.raw, SignupSchema);
    if (!parsed.ok) return parsed.response;

    const turnstileOk = await verifyTurnstile(
      parsed.data.turnstile_token,
      c.req.header("cf-connecting-ip") ?? null,
      c.env.TURNSTILE_SECRET_KEY,
      c.env.APP_ENV
    );

    if (!turnstileOk) {
      return c.json({ error: "Turnstile verification failed", code: "TURNSTILE_FAILED" }, 403);
    }

    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?1").bind(parsed.data.email).first<{ id: string }>();
    if (existing) {
      return c.json({ error: "Email already in use", code: "EMAIL_EXISTS" }, 409);
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(parsed.data.password);

    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
    )
      .bind(userId, parsed.data.email, passwordHash, parsed.data.role)
      .run();

    const token = await issueJwt(
      {
        sub: userId,
        role: parsed.data.role,
        provider_id: undefined
      },
      c.env.JWT_ISSUER,
      c.env.JWT_SECRET
    );

    await writeAuditLog(c.env, "user", userId, "auth.signup", "user", userId, {
      email: parsed.data.email,
      role: parsed.data.role
    });

    return c.json({
      user_id: userId,
      role: parsed.data.role,
      token
    });
  });

  app.post("/v1/auth/login", async (c) => {
    const parsed = await parseJson(c.req.raw, LoginSchema);
    if (!parsed.ok) return parsed.response;

    const turnstileOk = await verifyTurnstile(
      parsed.data.turnstile_token,
      c.req.header("cf-connecting-ip") ?? null,
      c.env.TURNSTILE_SECRET_KEY,
      c.env.APP_ENV
    );

    if (!turnstileOk) {
      return c.json({ error: "Turnstile verification failed", code: "TURNSTILE_FAILED" }, 403);
    }

    const row = await c.env.DB.prepare(
      `SELECT
        u.id,
        u.password_hash,
        u.role,
        p.id AS provider_id
       FROM users u
       LEFT JOIN providers p ON p.user_id = u.id
       WHERE u.email = ?1`
    )
      .bind(parsed.data.email)
      .first<{ id: string; password_hash: string; role: "customer" | "provider" | "agent" | "admin"; provider_id: string | null }>();

    if (!row) {
      return c.json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" }, 401);
    }

    const passwordOk = await verifyPassword(parsed.data.password, row.password_hash);
    if (!passwordOk) {
      return c.json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" }, 401);
    }

    const token = await issueJwt(
      {
        sub: row.id,
        role: row.role,
        provider_id: row.provider_id ?? undefined
      },
      c.env.JWT_ISSUER,
      c.env.JWT_SECRET
    );

    await writeAuditLog(c.env, "user", row.id, "auth.login", "user", row.id, {});

    return c.json({
      user_id: row.id,
      role: row.role,
      provider_id: row.provider_id,
      token
    });
  });

  app.post("/v1/auth/bootstrap-admin", async (c) => {
    if (c.env.APP_ENV === "prod") {
      return c.json({ error: "Admin bootstrap disabled in production", code: "FORBIDDEN" }, 403);
    }

    const parsed = await parseJson(c.req.raw, BootstrapAdminSchema);
    if (!parsed.ok) return parsed.response;

    const turnstileOk = await verifyTurnstile(
      parsed.data.turnstile_token,
      c.req.header("cf-connecting-ip") ?? null,
      c.env.TURNSTILE_SECRET_KEY,
      c.env.APP_ENV
    );
    if (!turnstileOk) {
      return c.json({ error: "Turnstile verification failed", code: "TURNSTILE_FAILED" }, 403);
    }

    const adminCount = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first<{ count: number }>();
    if (Number(adminCount?.count ?? 0) > 0) {
      return c.json({ error: "Admin already bootstrapped", code: "ADMIN_ALREADY_EXISTS" }, 409);
    }

    const existing = await c.env.DB.prepare("SELECT id, role FROM users WHERE email = ?1").bind(parsed.data.email).first<{ id: string; role: string }>();
    if (existing) {
      return c.json({ error: "Email already in use", code: "EMAIL_EXISTS" }, 409);
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(parsed.data.password);

    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'admin', datetime('now'), datetime('now'))`
    )
      .bind(userId, parsed.data.email, passwordHash)
      .run();

    const token = await issueJwt(
      {
        sub: userId,
        role: "admin"
      },
      c.env.JWT_ISSUER,
      c.env.JWT_SECRET
    );

    await writeAuditLog(c.env, "admin", userId, "auth.bootstrap_admin", "user", userId, { email: parsed.data.email });

    return c.json({
      user_id: userId,
      role: "admin",
      token
    });
  });
}
