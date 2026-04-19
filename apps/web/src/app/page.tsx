import Link from "next/link";
import NetworkGraph from "@/components/NetworkGraph";
import NetworkLogo from "@/components/NetworkLogo";
import Eyebrow from "@/components/Eyebrow";
import Dot from "@/components/Dot";
import { NT, N_btnPrimary, N_btnGhost } from "@/components/tokens";

const BackgroundGradient = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 80% 10%, rgba(142,201,248,0.12), transparent 50%), radial-gradient(circle at 20% 90%, rgba(93,168,236,0.08), transparent 50%)",
      pointerEvents: "none",
    }}
  />
);

const NetworkHero = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg, position: "relative", overflow: "hidden" }}>
    <BackgroundGradient />
    <div
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "88px 32px 88px",
        display: "grid",
        gridTemplateColumns: "1fr 1.1fr",
        gap: 64,
        alignItems: "center",
        fontFamily: NT.display,
      }}
    >
      <div>
        <h1 className="cc-shimmer" style={{ fontSize: 72, lineHeight: 0.98, letterSpacing: -2.8, fontWeight: 500, margin: "24px 0 0" }}>
          The batch AI bill<br />you shouldn&apos;t be paying.
        </h1>
        <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.6, color: NT.text2, maxWidth: 520 }}>
          A fraction of the cost of OpenAI and AWS for the batch work that&apos;s already bloating your bill — embeddings,
          transcription, OCR, rerankers, image captioning. One SDK call, deterministic pricing, signed receipts.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/developers" style={N_btnPrimary({ padding: "12px 18px", fontSize: 14 })}>Start a job →</Link>
          <Link href="/pricing" style={N_btnGhost({ padding: "12px 18px", fontSize: 14 })}>View pricing</Link>
          <Link
            href="/providers"
            style={N_btnGhost({
              padding: "12px 18px",
              fontSize: 14,
              background: NT.blue,
              color: "#0A0C10",
              border: `1px solid ${NT.blue}`,
            })}
          >
            Download Mac app
          </Link>
        </div>
        <div style={{ marginTop: 28, display: "flex", gap: 18, color: NT.text3, fontFamily: NT.mono, fontSize: 11.5, flexWrap: "wrap" }}>
          <span>pip install common-compute</span>
          <span>·</span>
          <span>drop-in OpenAI-compatible</span>
          <span>·</span>
          <span>Python + TS</span>
        </div>
      </div>
      <NetworkGraph />
    </div>
  </section>
);

const NetworkStats = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "48px 32px",
        fontFamily: NT.display,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 32,
      }}
    >
      {[
        ["Typical savings", "[N]%", "vs. OpenAI / AWS list price"],
        ["Tasks completed", "[N]", "On the network to date"],
        ["Time-to-first-result", "[N]s", "p50 for embeddings"],
        ["Capacity online", "[N]", "Macs available right now"],
      ].map(([k, v, sub], i) => (
        <div key={i} className="cc-rise" style={{ animationDelay: i * 0.08 + "s" }}>
          <div
            style={{
              fontFamily: NT.mono,
              fontSize: 10.5,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: NT.text3,
            }}
          >
            {k}
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 500,
              letterSpacing: -1.5,
              margin: "10px 0 6px",
              background: `linear-gradient(180deg, ${NT.text}, ${NT.silver2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {v}
          </div>
          <div style={{ fontSize: 13, color: NT.text3 }}>{sub}</div>
        </div>
      ))}
    </div>
  </section>
);

const WORKLOADS = [
  { task: "Embeddings", models: "bge-large · e5-mistral · nomic", use: "Index your corpus nightly. Swap in without changing a line of inference code.", unit: "per 1M tokens" },
  { task: "Transcription", models: "whisper-large-v3 · distil-whisper", use: "Turn call recordings, meetings, podcasts into searchable text — in bulk.", unit: "per audio hour" },
  { task: "OCR", models: "paddleocr · surya · tesseract", use: "Convert PDF archives, receipts, scanned contracts into structured JSON.", unit: "per 1k pages" },
  { task: "Rerankers", models: "bge-reranker · cohere-rerank-compat", use: "Tighten retrieval quality on existing RAG pipelines without changing infra.", unit: "per 1k pairs" },
  { task: "Image captioning", models: "florence-2 · llava · blip-2", use: "Caption product catalogs, moderate UGC, enrich media libraries.", unit: "per 1k images" },
  { task: "Custom batch jobs", models: "bring your own model", use: "Any deterministic GPU workload. Ship a container, we shard and settle.", unit: "quoted" },
];

const NetworkWorkloads = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>What you can run</Eyebrow>
      <h2 style={{ fontSize: 44, letterSpacing: -1.8, fontWeight: 500, color: NT.text, margin: "14px 0 16px", lineHeight: 1.05, maxWidth: 700 }}>
        The workloads eating your GPU budget. At a fraction of the price.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: NT.text2, maxWidth: 600, margin: "0 0 40px" }}>
        Common Compute is built for throughput, not realtime. If your workload can tolerate seconds of latency for a dramatic cost cut, it belongs here.
      </p>
      <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
        {WORKLOADS.map((it, i) => (
          <div
            key={it.task}
            className="cc-row-scan"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 240px 1fr 140px",
              gap: 24,
              padding: "20px 24px",
              borderTop: i === 0 ? "none" : `1px solid ${NT.line}`,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 17, color: NT.text, fontWeight: 500, letterSpacing: -0.3 }}>{it.task}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 11.5, color: NT.text3, letterSpacing: 0.2 }}>{it.models}</div>
            <div style={{ fontSize: 14, color: NT.text2, lineHeight: 1.5 }}>{it.use}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 11.5, color: NT.text3, textAlign: "right" }}>{it.unit}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const NStat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div style={{ border: `1px solid ${NT.line}`, borderRadius: 6, padding: "10px 12px" }}>
    <div style={{ fontFamily: NT.mono, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", color: NT.text4 }}>{label}</div>
    <div style={{ fontSize: 20, letterSpacing: -0.5, color: accent ? NT.positive : NT.text, marginTop: 4 }}>{value}</div>
  </div>
);

const NetworkCodeMock = () => (
  <pre
    style={{
      margin: 0,
      background: NT.panel2,
      color: NT.text,
      padding: "18px 20px",
      borderRadius: 8,
      fontFamily: NT.mono,
      fontSize: 12.5,
      lineHeight: 1.7,
      border: `1px solid ${NT.line}`,
      overflow: "hidden",
    }}
  >
    <div><span style={{ color: NT.text4 }}>1</span>  <span style={{ color: "#C7A7F0" }}>from</span> commoncompute <span style={{ color: "#C7A7F0" }}>import</span> Client</div>
    <div><span style={{ color: NT.text4 }}>2</span>  </div>
    <div><span style={{ color: NT.text4 }}>3</span>  cc = Client()</div>
    <div><span style={{ color: NT.text4 }}>4</span>  job = cc.embeddings.create(</div>
    <div><span style={{ color: NT.text4 }}>5</span>      model=<span style={{ color: "#98D1A0" }}>&quot;bge-large&quot;</span>,</div>
    <div><span style={{ color: NT.text4 }}>6</span>      input=<span style={{ color: "#C7A7F0" }}>open</span>(<span style={{ color: "#98D1A0" }}>&quot;corpus.jsonl&quot;</span>),</div>
    <div><span style={{ color: NT.text4 }}>7</span>  )</div>
    <div><span style={{ color: NT.text4 }}>8</span>  <span style={{ color: NT.text3 }}># → job.id, job.price, job.eta</span><span className="cc-caret" /></div>
  </pre>
);

const NetworkMenubarMock = () => (
  <div style={{ border: `1px solid ${NT.line}`, borderRadius: 8, overflow: "hidden", background: NT.panel2 }}>
    <div
      style={{
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: `1px solid ${NT.line}`,
        fontFamily: NT.mono,
        fontSize: 11,
        color: NT.text3,
      }}
    >
      <Dot color={NT.positive} size={6} pulse />
      <span>Common Compute</span>
      <span style={{ marginLeft: "auto", color: NT.text4 }}>⌘,</span>
    </div>
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 14, color: NT.text }}>Sharing — idle</div>
      <div style={{ fontSize: 12, color: NT.text3, marginTop: 4 }}>Running sandboxed workloads</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <NStat label="This week" value="[$N]" accent />
        <NStat label="Tasks" value="[N]" />
      </div>
      <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: "42%", height: "100%", background: `linear-gradient(90deg, ${NT.blueDeep}, ${NT.blue})` }} />
      </div>
      <div style={{ fontFamily: NT.mono, fontSize: 10.5, color: NT.text4, marginTop: 10, letterSpacing: 0.3 }}>
        CPU 14% · MEM 3.2 GB · THERM nominal
      </div>
    </div>
  </div>
);

type CardProps = {
  kicker: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  visual: React.ReactNode;
};

const NetworkCard = ({ kicker, title, body, cta, href, visual }: CardProps) => (
  <div style={{ border: `1px solid ${NT.line}`, borderRadius: 12, overflow: "hidden", background: NT.panel }}>
    <div style={{ padding: "36px 36px 24px" }}>
      <Eyebrow>{kicker}</Eyebrow>
      <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1, color: NT.text, margin: "14px 0 14px", lineHeight: 1.1 }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: NT.text2, margin: 0, maxWidth: 420 }}>{body}</p>
    </div>
    <div style={{ padding: "0 36px 24px" }}>{visual}</div>
    <Link
      href={href}
      style={{
        borderTop: `1px solid ${NT.line}`,
        padding: "14px 36px",
        color: NT.text,
        fontSize: 13.5,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 6,
        textDecoration: "none",
      }}
    >
      {cta} →
    </Link>
  </div>
);

const NetworkAudiences = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <NetworkCard
          kicker="For developers"
          title="Drop-in replacement for the expensive parts of your AI stack."
          body="Point your embeddings, Whisper, OCR, and rerank calls at Common Compute. Same interfaces you already use. A fraction of the cost. Deterministic quotes before every job runs — no more surprise month-end invoices."
          cta="Read the SDK docs"
          href="/developers"
          visual={<NetworkCodeMock />}
        />
        <NetworkCard
          kicker="Have a Mac?"
          title="Share idle cycles. Get paid."
          body="Install the menu-bar app. It runs sandboxed workloads when your Mac is idle and on power, pauses instantly when you touch it, and pays weekly in USD."
          cta="Install the Mac app"
          href="/providers"
          visual={<NetworkMenubarMock />}
        />
      </div>
    </div>
  </section>
);

const FEATURES = [
  { t: "Verifiable by default", d: "Every task result is signed by its provider. Independently replayable." },
  { t: "Sandboxed workloads", d: "Providers run jobs in a hardened VM. Zero filesystem or network access." },
  { t: "Deterministic pricing", d: "Quotes are fixed before the job runs. No hourly drift, no idle charges." },
  { t: "Python + TypeScript", d: "Drop-in compatibility with existing embeddings pipelines." },
  { t: "Data residency", d: "Pin jobs to providers in specific regions for compliance-sensitive work." },
  { t: "Open ledger", d: "Aggregate network activity is public and queryable — no marketing theater." },
];

const NetworkFeatures = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Under the hood</Eyebrow>
      <h2 style={{ fontSize: 44, letterSpacing: -1.8, fontWeight: 500, color: NT.text, margin: "14px 0 48px", lineHeight: 1.05, maxWidth: 680 }}>
        Built for engineers who need to trust the result.
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: NT.line,
          border: `1px solid ${NT.line}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {FEATURES.map((f, i) => (
          <div key={f.t} style={{ background: NT.panel, padding: "28px 28px 32px" }}>
            <div style={{ fontFamily: NT.mono, fontSize: 10.5, color: NT.text4, letterSpacing: 0.5 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: -0.3, color: NT.text, margin: "10px 0 10px" }}>
              {f.t}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55, color: NT.text2 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PRICING_PREVIEW: Array<[string, string, string, string]> = [
  ["Embeddings · bge-large", "per 1M tokens", "$0.009", "55% lower"],
  ["Transcription · whisper-large", "per audio hour", "$0.18", "50% lower"],
  ["OCR · pdf", "per 1k pages", "$0.85", "43% lower"],
  ["Image captioning", "per 1k images", "$0.22", "56% lower"],
];

const nth = () => ({
  textAlign: "left" as const,
  padding: "12px 20px",
  fontWeight: 500,
  borderBottom: `1px solid ${NT.line}`,
});
const ntd = (s: React.CSSProperties = {}) => ({ padding: "14px 20px", ...s });

const NetworkPricing = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Pricing</Eyebrow>
      <h2 style={{ fontSize: 44, letterSpacing: -1.8, fontWeight: 500, color: NT.text, margin: "14px 0 16px", lineHeight: 1.05 }}>
        Pay per task. That&apos;s it.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: NT.text2, maxWidth: 600, margin: "0 0 40px" }}>
        Transparent per-workload pricing. Quotes are locked at submission. Capped by your max_spend_usd.
      </p>
      <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: NT.display }}>
          <thead>
            <tr
              style={{
                background: NT.panel2,
                color: NT.text3,
                fontFamily: NT.mono,
                fontSize: 10.5,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              <th style={nth()}>Task</th>
              <th style={nth()}>Unit</th>
              <th style={nth()}>Typical cost</th>
              <th style={nth()}>vs. hyperscaler</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: 14 }}>
            {PRICING_PREVIEW.map((r) => (
              <tr key={r[0]} style={{ borderTop: `1px solid ${NT.lineSoft}` }}>
                <td style={ntd({ color: NT.text, fontWeight: 500 })}>{r[0]}</td>
                <td style={ntd({ color: NT.text3, fontFamily: NT.mono, fontSize: 12 })}>{r[1]}</td>
                <td style={ntd({ color: NT.text3, fontFamily: NT.mono, fontSize: 12 })}>{r[2]}</td>
                <td style={ntd({ color: NT.positive, fontFamily: NT.mono, fontSize: 12 })}>−{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link href="/pricing" style={{ color: NT.blue, fontSize: 13.5, textDecoration: "none", fontFamily: NT.display }}>
          See full pricing →
        </Link>
      </div>
    </div>
  </section>
);

const NetworkCTA = () => (
  <section style={{ background: NT.bg, position: "relative", overflow: "hidden" }}>
    <BackgroundGradient />
    <div
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "120px 32px",
        textAlign: "center",
        fontFamily: NT.display,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <NetworkLogo size={72} />
      </div>
      <h2
        style={{
          fontSize: 60,
          letterSpacing: -2.4,
          fontWeight: 500,
          margin: "20px 0 16px",
          lineHeight: 1,
          background: `linear-gradient(180deg, ${NT.text} 0%, ${NT.silver2} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Run one job. See it land.
      </h2>
      <p style={{ fontSize: 17, color: NT.text2, margin: "0 auto", maxWidth: 520, lineHeight: 1.55 }}>
        The network&apos;s built from Macs like yours. Join as a developer or a provider.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 32, justifyContent: "center" }}>
        <Link href="/developers" style={N_btnPrimary({ padding: "13px 20px", fontSize: 14 })}>Create an account</Link>
        <Link
          href="/providers"
          style={N_btnGhost({ padding: "13px 20px", fontSize: 14, background: NT.blue, color: "#0A0C10", border: `1px solid ${NT.blue}` })}
        >
          Download the Mac app
        </Link>
      </div>
    </div>
  </section>
);

export default function HomePage() {
  return (
    <>
      <NetworkHero />
      <NetworkStats />
      <NetworkWorkloads />
      <NetworkAudiences />
      <NetworkFeatures />
      <NetworkPricing />
      <NetworkCTA />
    </>
  );
}
