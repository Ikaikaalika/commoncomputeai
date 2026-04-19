import type { Metadata } from "next";
import Eyebrow from "@/components/Eyebrow";
import Estimator from "@/components/Estimator";
import { PRICING } from "@/components/pricing-data";
import { NT } from "@/components/tokens";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay per task. Quotes locked at submission. Capped by your max_spend_usd. Transparent per-workload pricing.",
};

const PriceHero = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "88px 32px 48px", fontFamily: NT.display }}>
      <Eyebrow>Pricing</Eyebrow>
      <h1
        className="cc-shimmer"
        style={{
          fontSize: 72,
          lineHeight: 0.98,
          letterSpacing: -2.8,
          fontWeight: 500,
          margin: "22px 0 20px",
          maxWidth: 900,
        }}
      >
        Pay per task. Priced before it runs.
      </h1>
      <p style={{ fontSize: 19, lineHeight: 1.5, color: NT.text2, maxWidth: 660, margin: 0 }}>
        Every job gets a deterministic quote at submission. No per-second billing, no surprise egress, no minimum
        commitments. Pay for finished tasks with signed receipts — nothing else.
      </p>
    </div>
  </section>
);

const PriceTable = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 32px 96px", fontFamily: NT.display }}>
      <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 180px 140px 140px 1fr 120px",
            padding: "16px 24px",
            fontFamily: NT.mono,
            fontSize: 10.5,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: NT.text3,
            borderBottom: `1px solid ${NT.line}`,
          }}
        >
          <div>Workload</div>
          <div>Unit</div>
          <div style={{ textAlign: "right" }}>Batch</div>
          <div style={{ textAlign: "right" }}>Realtime</div>
          <div>Compare against</div>
          <div style={{ textAlign: "right" }}>Savings</div>
        </div>
        {PRICING.map((p) => (
          <div
            key={p.task}
            className="cc-row-scan"
            style={{
              display: "grid",
              gridTemplateColumns: "200px 180px 140px 140px 1fr 120px",
              padding: "20px 24px",
              borderTop: `1px solid ${NT.line}`,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 16, color: NT.text, fontWeight: 500, letterSpacing: -0.3 }}>{p.task}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 12, color: NT.text3 }}>{p.unit}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 14, color: NT.text, textAlign: "right" }}>
              {p.batch !== null ? `$${p.batch.toFixed(p.batch < 0.1 ? 3 : 2)}` : "—"}
            </div>
            <div style={{ fontFamily: NT.mono, fontSize: 13, color: NT.text3, textAlign: "right" }}>
              {p.realtime !== null ? `$${p.realtime.toFixed(p.realtime < 0.1 ? 3 : 2)}` : "—"}
            </div>
            <div style={{ fontSize: 12.5, color: NT.text2 }}>{p.vs}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 13, color: NT.positive, textAlign: "right" }}>
              {p.savings !== "—" ? `−${p.savings}` : "—"}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: NT.mono, fontSize: 11.5, color: NT.text4, marginTop: 16, lineHeight: 1.7 }}>
        Prices in USD. Batch = tolerates seconds of latency (3–6× cheaper). Realtime = sub-second dispatch. All quotes
        are locked at submission and capped by max_spend_usd.
      </div>
    </div>
  </section>
);

const FAQ: Array<[string, string]> = [
  ["How is this cheaper?", "Apple Silicon idle capacity is already paid for by its owners. We pay them a small share, skim a margin, and pass the rest to you. No data-center real estate, no cooling, no hyperscaler markup."],
  ["Are quotes really locked?", "Yes. Every submission returns a deterministic price before execution. Tasks that would exceed your max_spend_usd are paused, not silently billed."],
  ['What counts as "batch" vs "realtime"?', "Batch jobs tolerate seconds of latency and run on the cheapest available capacity. Realtime gets priority dispatch — good for interactive workloads, 3× the price."],
  ["Do you charge for failed tasks?", "No. Only successful, receipted results are billed. Retries are free."],
  ["Is there a free tier?", "$25 in credits on signup. No card required."],
  ["Can I get volume pricing?", "Yes. For sustained volume above ~$5k/mo we offer reserved capacity at further discounts. Contact sales."],
];

const PriceFAQ = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "96px 32px",
        fontFamily: NT.display,
        display: "grid",
        gridTemplateColumns: "1fr 2fr",
        gap: 64,
      }}
    >
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <h2 style={{ fontSize: 40, letterSpacing: -1.6, fontWeight: 500, color: NT.text, margin: "14px 0 0", lineHeight: 1.05 }}>
          Pricing, explained.
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden" }}>
        {FAQ.map((q, i) => (
          <div
            key={q[0]}
            style={{
              padding: "22px 24px",
              borderTop: i === 0 ? "none" : `1px solid ${NT.line}`,
              background: NT.panel,
            }}
          >
            <div style={{ fontSize: 16, color: NT.text, fontWeight: 500, letterSpacing: -0.2, marginBottom: 8 }}>{q[0]}</div>
            <div style={{ fontSize: 13.5, color: NT.text2, lineHeight: 1.6 }}>{q[1]}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default function PricingPage() {
  return (
    <>
      <PriceHero />
      <PriceTable />
      <Estimator />
      <PriceFAQ />
    </>
  );
}
