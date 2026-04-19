-- Adds the full_name column the api-v2 /v1/auth/register endpoint
-- writes to. Schema drift discovered during the mac-app-flow e2e on
-- 2026-04-19 — converging to a single source of truth.
--
-- SQLite doesn't let us add a NOT NULL column without a default, so
-- we default to '' for legacy rows. /v1/auth/register always sets a
-- real value going forward.

ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
