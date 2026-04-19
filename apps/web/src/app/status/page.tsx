"use client";

import { useEffect, useState } from "react";
import { NT } from "@/components/tokens";
import Eyebrow from "@/components/Eyebrow";

interface ServiceCheck {
  name: string;
  host: string;
  path: string;
  status: "checking" | "up" | "down";
  latencyMs?: number;
  error?: string;
}

const ENDPOINTS: Array<{ name: string; host: string; path: string }> = [
  { name: "Marketing site", host: "https://commoncompute.ai", path: "/" },
  { name: "API",            host: "https://api.commoncompute.ai", path: "/healthz" },
  { name: "Router",         host: "https://router.commoncompute.ai", path: "/healthz" },
];

async function probe(endpoint: { name: string; host: string; path: string }): Promise<ServiceCheck> {
  const url = endpoint.host + endpoint.path;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return {
      ...endpoint,
      status: res.ok ? "up" : "down",
      latencyMs,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ...endpoint,
      status: "down",
      error: err instanceof Error ? err.message : "unreachable",
    };
  }
}

export default function StatusPage() {
  const [checks, setChecks] = useState<ServiceCheck[]>(
    ENDPOINTS.map((e) => ({ ...e, status: "checking" }))
  );
  const [checkedAt, setCheckedAt] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results = await Promise.all(ENDPOINTS.map(probe));
      if (!cancelled) {
        setChecks(results);
        setCheckedAt(new Date().toISOString());
      }
    }

    run();
    const interval = setInterval(run, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const pending = checks.some((c) => c.status === "checking");
  const allUp = !pending && checks.every((c) => c.status === "up");
  const headline = pending ? "Checking…" : allUp ? "All systems operational." : "Partial outage.";

  return (
    <section style={{ background: NT.bg, minHeight: "70vh", borderBottom: `1px solid ${NT.line}` }}>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "96px 32px",
          fontFamily: NT.display,
        }}
      >
        <Eyebrow>Status</Eyebrow>
        <h1
          style={{
            fontSize: 56,
            letterSpacing: -2.0,
            fontWeight: 500,
            margin: "16px 0 20px",
            lineHeight: 1.05,
            color: allUp ? NT.text : pending ? NT.text2 : NT.blue,
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: NT.text3,
            fontFamily: NT.mono,
            marginBottom: 40,
          }}
        >
          {checkedAt
            ? `Last checked ${new Date(checkedAt).toLocaleString()} · refreshes every 30 s`
            : "Probing…"}
        </p>

        <div
          style={{
            border: `1px solid ${NT.line}`,
            borderRadius: 12,
            overflow: "hidden",
            background: NT.panel,
          }}
        >
          {checks.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 22px",
                borderTop: i === 0 ? "none" : `1px solid ${NT.lineSoft}`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 10,
                  background:
                    c.status === "up"
                      ? NT.positive
                      : c.status === "down"
                      ? "#E77B7B"
                      : NT.silver2,
                  boxShadow: c.status === "up" ? `0 0 0 4px ${NT.positive}22` : "none",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: NT.text }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: NT.text3, fontFamily: NT.mono, marginTop: 2 }}>
                  {c.host}{c.path}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: NT.mono, fontSize: 11 }}>
                {c.status === "up" && (
                  <span style={{ color: NT.positive }}>
                    UP {c.latencyMs ? `· ${c.latencyMs} ms` : ""}
                  </span>
                )}
                {c.status === "down" && (
                  <span style={{ color: "#E77B7B" }}>
                    DOWN {c.error ? `· ${c.error}` : ""}
                  </span>
                )}
                {c.status === "checking" && (
                  <span style={{ color: NT.text3 }}>CHECKING…</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 12,
            color: NT.text3,
            marginTop: 32,
            lineHeight: 1.55,
          }}
        >
          Probed from your browser; you see the same reachability as your app would.
          Incidents and scheduled maintenance post to{" "}
          <a href="mailto:support@commoncompute.ai" style={{ color: NT.blue, textDecoration: "none" }}>
            support@commoncompute.ai
          </a>
          .
        </p>
      </div>
    </section>
  );
}
