import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import CodeBlock, { clr, hl } from "@/components/CodeBlock";
import DevExamples from "@/components/Tabs";
import { NT, N_btnPrimary, N_btnGhost } from "@/components/tokens";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Drop-in SDKs for the expensive parts of your AI stack — embeddings, transcription, OCR, rerankers, image captioning.",
};

const DevHero = () => {
  const lines = [
    hl([["# Embed 10M documents with one call", clr.com]]),
    hl([["from", clr.kw], [" commoncompute ", null], ["import", clr.kw], [" Client", null]]),
    "",
    hl([["cc ", null], ["= ", clr.kw], ["Client", clr.fn], ["(api_key=", null], ['"cc_live_…"', clr.str], [")", null]]),
    "",
    hl([["job ", null], ["= ", clr.kw], ["cc.embeddings.batch", clr.fn], ["(", null]]),
    hl([["    model=", null], ['"bge-large-en-v1.5"', clr.str], [",", null]]),
    hl([["    inputs=", null], ["open", clr.fn], ["(", null], ['"docs.jsonl"', clr.str], ["),", null]]),
    hl([["    priority=", null], ['"batch"', clr.str], [",  ", null], ["# 3–6× cheaper than realtime", clr.com]]),
    hl([["    max_spend_usd=", null], ["50", clr.num], [",  ", null], ["# hard cap", clr.com]]),
    hl([[")", null]]),
    "",
    hl([["for", clr.kw], [" result ", null], ["in", clr.kw], [" job.stream", clr.fn], ["():", null]]),
    hl([["    db.upsert", clr.fn], ["(result.id, result.vector)", null]]),
  ];
  return (
    <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "88px 32px 72px",
          fontFamily: NT.display,
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <Eyebrow>For developers</Eyebrow>
          <h1
            className="cc-shimmer"
            style={{ fontSize: 64, lineHeight: 0.98, letterSpacing: -2.4, fontWeight: 500, margin: "22px 0 20px" }}
          >
            Cheap batch compute,<br />one import away.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: NT.text2, margin: "0 0 32px", maxWidth: 500 }}>
            Drop-in SDKs for the expensive parts of your AI stack — embeddings, transcription, OCR, rerankers. Same
            interfaces you already use. A fraction of the cost.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
            <Link href="/docs" style={N_btnPrimary({ padding: "12px 18px", fontSize: 14 })}>Read the docs →</Link>
            <Link href="/pricing" style={N_btnGhost({ padding: "12px 18px", fontSize: 14 })}>See pricing</Link>
          </div>
          <div style={{ display: "flex", gap: 18, fontFamily: NT.mono, fontSize: 11.5, color: NT.text3, flexWrap: "wrap" }}>
            <span>pip install commoncompute</span>
            <span style={{ color: NT.text4 }}>·</span>
            <span>npm i @commoncompute/sdk</span>
          </div>
        </div>
        <CodeBlock lang="python" title="quickstart.py" lines={lines} />
      </div>
    </section>
  );
};

const DevExamplesSection = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.panel }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Examples</Eyebrow>
      <h2
        style={{
          fontSize: 44,
          letterSpacing: -1.8,
          fontWeight: 500,
          color: NT.text,
          margin: "14px 0 40px",
          lineHeight: 1.05,
          maxWidth: 700,
        }}
      >
        Idiomatic SDK, one-liners per workload.
      </h2>
      <DevExamples />
    </div>
  </section>
);

const COMPAT: Array<[string, string, string, string]> = [
  ["OpenAI", "from openai import OpenAI", "from commoncompute import OpenAICompat as OpenAI", "Embeddings, moderation"],
  ["Cohere", "import cohere", "from commoncompute import CohereCompat as cohere", "Rerank, embed"],
  ["AWS Transcribe", "import boto3", "from commoncompute import TranscribeCompat as boto3", "Bulk transcription"],
  ["HuggingFace", "from transformers import pipeline", "from commoncompute import pipeline", "Any supported model"],
];

const DevCompat = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Drop-in compatibility</Eyebrow>
      <h2
        style={{
          fontSize: 44,
          letterSpacing: -1.8,
          fontWeight: 500,
          color: NT.text,
          margin: "14px 0 16px",
          lineHeight: 1.05,
          maxWidth: 720,
        }}
      >
        Change the import. Keep everything else.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: NT.text2, maxWidth: 620, margin: "0 0 40px" }}>
        Our SDKs mirror the interfaces you already call. No surgery on retry logic, serialization, or types — just a
        one-line swap at the top of the file.
      </p>
      <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1.3fr 1.3fr 160px",
            padding: "14px 20px",
            fontFamily: NT.mono,
            fontSize: 10.5,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: NT.text3,
            borderBottom: `1px solid ${NT.line}`,
          }}
        >
          <div>Provider</div>
          <div>What you have</div>
          <div>What to use instead</div>
          <div style={{ textAlign: "right" }}>Coverage</div>
        </div>
        {COMPAT.map((r) => (
          <div
            key={r[0]}
            className="cc-row-scan"
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1.3fr 1.3fr 160px",
              padding: "18px 20px",
              borderTop: `1px solid ${NT.line}`,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 15, color: NT.text, fontWeight: 500 }}>{r[0]}</div>
            <div
              style={{
                fontFamily: NT.mono,
                fontSize: 12,
                color: NT.text3,
                textDecoration: "line-through",
                textDecorationColor: "rgba(239,102,102,0.5)",
              }}
            >
              {r[1]}
            </div>
            <div style={{ fontFamily: NT.mono, fontSize: 12, color: NT.blue }}>{r[2]}</div>
            <div style={{ fontSize: 12.5, color: NT.text2, textAlign: "right" }}>{r[3]}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const GUARANTEES = [
  { k: "Deterministic quotes", v: "Every job is priced before it runs. The number you see at submission is the number you pay." },
  { k: "Sandboxed execution", v: "Your code runs in signed, ephemeral containers. No shared state between tenants. No logs retained by default." },
  { k: "Signed receipts", v: "Every completed task emits a cryptographic receipt. Audit trail, attributable to the node that ran it." },
  { k: "Exactly-once semantics", v: "Dedup keys per-task. Reconnect, restart, or re-run without duplicate work or double-billing." },
  { k: "Hard spend caps", v: "Set a max_spend_usd. We pause the job before we cross it, never after." },
  { k: "No lock-in", v: "Compatible interfaces mean you can move back to hyperscalers any time by flipping a flag." },
];

const DevGuarantees = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.panel }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Guarantees</Eyebrow>
      <h2
        style={{
          fontSize: 44,
          letterSpacing: -1.8,
          fontWeight: 500,
          color: NT.text,
          margin: "14px 0 40px",
          lineHeight: 1.05,
          maxWidth: 720,
        }}
      >
        Production-grade, not a hobbyist cluster.
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          background: NT.line,
          border: `1px solid ${NT.line}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {GUARANTEES.map((it) => (
          <div key={it.k} style={{ padding: "28px 28px", background: NT.panel }}>
            <div style={{ fontSize: 17, color: NT.text, fontWeight: 500, letterSpacing: -0.3, marginBottom: 10 }}>
              {it.k}
            </div>
            <div style={{ fontSize: 13.5, color: NT.text2, lineHeight: 1.6 }}>{it.v}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const DevCTA = () => (
  <section style={{ background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display, textAlign: "center" }}>
      <h2
        className="cc-shimmer"
        style={{ fontSize: 56, letterSpacing: -2.2, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.02 }}
      >
        Run one job. See it land.
      </h2>
      <p style={{ fontSize: 17, color: NT.text2, margin: "0 auto 32px", maxWidth: 520, lineHeight: 1.55 }}>
        Free credits on signup. No card. No cluster setup. You&apos;ll know in five minutes whether this is cheaper.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link href="/" style={N_btnPrimary({ padding: "14px 22px", fontSize: 14 })}>Get started →</Link>
        <Link href="/docs" style={N_btnGhost({ padding: "14px 22px", fontSize: 14 })}>Read the docs</Link>
      </div>
    </div>
  </section>
);

export default function DevelopersPage() {
  return (
    <>
      <DevHero />
      <DevExamplesSection />
      <DevCompat />
      <DevGuarantees />
      <DevCTA />
    </>
  );
}
