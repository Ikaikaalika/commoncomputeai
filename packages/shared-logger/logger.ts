// Structured JSON logging for Cloudflare Workers.
//
// Emits one JSON line per event to `console.log`, which Cloudflare
// Logpush captures verbatim. Downstream (Axiom, Logtail, Datadog) can
// ingest without transforms. Also usable from the deploy side — any
// `console.log` in a Worker already flows to Logpush.
//
// Keep the shape stable; downstream dashboards depend on field names.
//
// Usage:
//   import { Logger } from './logger';
//   const log = new Logger({ service: 'api-v2' });
//   log.info('auth.login', { user_id, ok: true });
//   log.error('db.query', { err: String(err) });

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  [key: string]: unknown;
}

export interface LoggerOptions {
  service: string;         // "api-v2" | "router"
  environment?: string;    // "prod" | "staging" | "local"
  defaults?: LogFields;    // fields merged into every event
}

export class Logger {
  private readonly service: string;
  private readonly environment: string;
  private readonly defaults: LogFields;

  constructor(opts: LoggerOptions) {
    this.service = opts.service;
    this.environment = opts.environment ?? 'unknown';
    this.defaults = opts.defaults ?? {};
  }

  /** Creates a child logger with additional default fields (e.g. per-request). */
  child(extra: LogFields): Logger {
    return new Logger({
      service: this.service,
      environment: this.environment,
      defaults: { ...this.defaults, ...extra },
    });
  }

  debug(event: string, fields: LogFields = {}) { this.emit('debug', event, fields); }
  info(event: string, fields: LogFields = {})  { this.emit('info',  event, fields); }
  warn(event: string, fields: LogFields = {})  { this.emit('warn',  event, fields); }
  error(event: string, fields: LogFields = {}) { this.emit('error', event, fields); }

  private emit(level: LogLevel, event: string, fields: LogFields) {
    const line = {
      ts: new Date().toISOString(),
      level,
      service: this.service,
      env: this.environment,
      event,
      ...this.defaults,
      ...fields,
    };
    // JSON.stringify handles Date/Error/nested objects predictably;
    // errors below may throw on unserializable fields so guard.
    try {
      console.log(JSON.stringify(line));
    } catch {
      console.log(JSON.stringify({ ...line, _serialize_error: true }));
    }
  }
}

/**
 * Hono middleware that logs one line per request at INFO with
 * duration_ms + status, and attaches a child logger to `c.var.log`.
 * Usage:
 *   app.use('*', requestLogger({ service: 'api-v2' }));
 *   app.get('/x', (c) => { c.var.log.info('x.hit', { a: 1 }); ... });
 */
export function requestLogger(opts: LoggerOptions) {
  const base = new Logger(opts);
  return async (c: any, next: () => Promise<void>) => {
    const start = Date.now();
    const requestId = c.req.header('cf-ray') ?? crypto.randomUUID();
    const log = base.child({ request_id: requestId });
    c.set('log', log);

    try {
      await next();
      log.info('http.request', {
        route: new URL(c.req.url).pathname,
        method: c.req.method,
        status: c.res.status,
        duration_ms: Date.now() - start,
      });
    } catch (err) {
      log.error('http.error', {
        route: new URL(c.req.url).pathname,
        method: c.req.method,
        duration_ms: Date.now() - start,
        err: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}
