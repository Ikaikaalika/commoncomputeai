import { Hono } from 'hono';
import type { Env } from '../../types';

// Diagnostics ingress from the Mac app's DiagnosticsReporter.
//
// Bodies are MetricKit JSON payloads — opaque to us. We stash them in
// R2 keyed by date/bundle/version/random, and emit a structured log
// line so Axiom can alert on crash volume without us having to set up
// a parser.

export const diagRouter = new Hono<{ Bindings: Env; Variables: { log: any } }>();

diagRouter.post('/crash', async (c) => {
  return ingest(c, 'crash');
});

diagRouter.post('/metric', async (c) => {
  return ingest(c, 'metric');
});

async function ingest(c: any, kind: 'crash' | 'metric') {
  const bundle = c.req.header('X-App-Bundle') ?? 'unknown';
  const version = c.req.header('X-App-Version') ?? 'unknown';
  const size = parseInt(c.req.header('content-length') ?? '0', 10);

  // Soft size cap — MetricKit diagnostics are typically < 50 KB.
  if (size > 5_000_000) {
    c.var.log?.warn('diag.oversized', { kind, size, bundle });
    return c.json({ error: 'payload too large' }, 413);
  }

  const body = await c.req.arrayBuffer();
  const date = new Date().toISOString().slice(0, 10);
  const rand = crypto.randomUUID();
  const key = `diagnostics/${date}/${bundle}/${version}/${kind}-${rand}.json`;

  try {
    await c.env.ARTIFACTS.put(key, body, {
      httpMetadata: { contentType: 'application/json' },
    });
    c.var.log?.info('diag.received', { kind, bundle, version, size, key });
    return c.json({ ok: true }, 202);
  } catch (err) {
    c.var.log?.error('diag.store_failed', {
      kind, bundle, version,
      err: err instanceof Error ? err.message : String(err),
    });
    return c.json({ error: 'storage failure' }, 500);
  }
}
