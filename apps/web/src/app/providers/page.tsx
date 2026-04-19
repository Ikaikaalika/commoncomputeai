import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Dot from "@/components/Dot";
import { NT, N_btnPrimary, N_btnGhost } from "@/components/tokens";

export const metadata: Metadata = {
  title: "Providers · Earn from your Mac",
  description:
    "Install the menu-bar app. Run sandboxed AI workloads on your idle Mac. Get paid weekly in USD.",
};

const EarnMenubarMock = () => (
  <div
    style={{
      border: `1px solid ${NT.line}`,
      borderRadius: 12,
      overflow: "hidden",
      background: NT.panel,
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    }}
  >
    <div
      style={{
        padding: "10px 14px",
        background: NT.panel2,
        borderBottom: `1px solid ${NT.line}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: NT.mono,
        fontSize: 11,
        color: NT.text3,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#FF6057" }} />
      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#FFBD2E" }} />
      <div style={{ width: 10, height: 10, borderRadius: 5, background: "#28C840" }} />
      <div style={{ marginLeft: "auto" }}>Common Compute · menu bar</div>
    </div>
    <div style={{ padding: "20px 20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Dot color={NT.positive} size={8} pulse />
          <span style={{ fontSize: 14, color: NT.text, fontWeight: 500 }}>Earning</span>
        </div>
        <span style={{ fontFamily: NT.mono, fontSize: 11, color: NT.text3 }}>task_f29ab · whisper-large</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 18 }}>
        {([
          ["This week", "$42.18"],
          ["This month", "$168.40"],
          ["Lifetime", "$1,427.05"],
          ["Tasks done", "8,421"],
        ] as Array<[string, string]>).map(([k, v]) => (
          <div key={k} style={{ border: `1px solid ${NT.line}`, borderRadius: 6, padding: "10px 12px", background: NT.bg }}>
            <div
              style={{
                fontFamily: NT.mono,
                fontSize: 9.5,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: NT.text3,
              }}
            >
              {k}
            </div>
            <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: -0.6, color: NT.text, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: NT.mono, fontSize: 10.5, color: NT.text3, marginBottom: 10 }}>CURRENT TASK</div>
      <div style={{ height: 4, background: NT.panel2, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: "64%", height: "100%", background: `linear-gradient(90deg, ${NT.blueDeep}, ${NT.blue})` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: NT.mono, fontSize: 10.5, color: NT.text3 }}>
        <span>00:47 / 01:13</span>
        <span>+$0.018</span>
      </div>
    </div>
  </div>
);

const EarnHero = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "88px 32px 72px",
        fontFamily: NT.display,
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: 64,
        alignItems: "center",
      }}
    >
      <div>
        <Eyebrow>For Mac owners</Eyebrow>
        <h1
          className="cc-shimmer"
          style={{ fontSize: 64, lineHeight: 0.98, letterSpacing: -2.4, fontWeight: 500, margin: "22px 0 20px" }}
        >
          Your idle Mac,<br />earning its keep.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: NT.text2, margin: "0 0 32px", maxWidth: 500 }}>
          Install the menu-bar app. It runs sandboxed AI workloads when your Mac is idle and on power, pauses instantly
          when you touch it, and pays weekly in USD.
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <Link
            href="/download"
            style={N_btnPrimary({ padding: "12px 18px", fontSize: 14, background: NT.blue, color: "#0A0C10" })}
          >
            Download for macOS
          </Link>
          <Link href="/pricing" style={N_btnGhost({ padding: "12px 18px", fontSize: 14 })}>How earnings work</Link>
        </div>
        <div style={{ display: "flex", gap: 22, fontFamily: NT.mono, fontSize: 11.5, color: NT.text3, flexWrap: "wrap" }}>
          <span>macOS 14+</span>
          <span style={{ color: NT.text4 }}>·</span>
          <span>M1 or newer</span>
          <span style={{ color: NT.text4 }}>·</span>
          <span>Notarized by Apple</span>
        </div>
      </div>
      <EarnMenubarMock />
    </div>
  </section>
);

const STEPS: Array<[string, string, string]> = [
  ["01", "Install", "Drag the menu-bar app into /Applications. Sign in with email or Apple ID. No kexts, no terminal."],
  ["02", "Set rules", "Choose when to participate — idle only, on power only, certain hours, max GPU heat. Defaults are safe."],
  ["03", "Earn", "Your Mac pulls sandboxed tasks from the queue, runs them, and uploads results. Paused instantly when you touch the keyboard."],
  ["04", "Get paid", "Weekly payouts in USD via ACH, Wise, or stablecoin. See every task on a signed ledger."],
];

const EarnHow = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.panel }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>How it works</Eyebrow>
      <h2
        style={{
          fontSize: 44,
          letterSpacing: -1.8,
          fontWeight: 500,
          color: NT.text,
          margin: "14px 0 48px",
          lineHeight: 1.05,
          maxWidth: 700,
        }}
      >
        Four steps. No servers to run.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {STEPS.map(([n, t, b]) => (
          <div key={n} style={{ borderLeft: `1px solid ${NT.line}`, paddingLeft: 20 }}>
            <div style={{ fontFamily: NT.mono, fontSize: 11, color: NT.blue, marginBottom: 14 }}>{n}</div>
            <div style={{ fontSize: 19, color: NT.text, fontWeight: 500, letterSpacing: -0.4, marginBottom: 10 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: NT.text2, lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const EARNINGS_ROWS: Array<[string, string, string, string, string]> = [
  ["M1 MacBook Air", "8 GB", "~4 hrs/day idle", "$18–34", "$70–140"],
  ["M2 Mac mini", "16 GB", "~18 hrs/day", "$60–110", "$240–440"],
  ["M3 MacBook Pro", "18 GB", "~6 hrs/day", "$42–78", "$170–310"],
  ["M4 Mac Studio", "64 GB", "~22 hrs/day", "$160–280", "$640–1120"],
  ["M4 Max MacBook Pro", "48 GB", "~8 hrs/day", "$95–175", "$380–700"],
];

const EarnEarnings = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Earnings</Eyebrow>
      <h2
        style={{
          fontSize: 44,
          letterSpacing: -1.8,
          fontWeight: 500,
          color: NT.text,
          margin: "14px 0 14px",
          lineHeight: 1.05,
          maxWidth: 720,
        }}
      >
        What a typical Mac makes.
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: NT.text2, maxWidth: 620, margin: "0 0 40px" }}>
        Earnings scale with GPU cores, RAM, and how often the machine is truly idle. These are observed ranges from the
        current network. Your mileage will vary.
      </p>
      <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 100px 1.2fr 140px 160px",
            padding: "16px 24px",
            fontFamily: NT.mono,
            fontSize: 10.5,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: NT.text3,
            borderBottom: `1px solid ${NT.line}`,
          }}
        >
          <div>Hardware</div>
          <div>RAM</div>
          <div>Typical idle</div>
          <div style={{ textAlign: "right" }}>Per week</div>
          <div style={{ textAlign: "right" }}>Per month</div>
        </div>
        {EARNINGS_ROWS.map((r) => (
          <div
            key={r[0]}
            className="cc-row-scan"
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 100px 1.2fr 140px 160px",
              padding: "18px 24px",
              borderTop: `1px solid ${NT.line}`,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 15, color: NT.text, fontWeight: 500 }}>{r[0]}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 12, color: NT.text3 }}>{r[1]}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 12, color: NT.text3 }}>{r[2]}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 14, color: NT.text, textAlign: "right" }}>{r[3]}</div>
            <div style={{ fontFamily: NT.mono, fontSize: 14, color: NT.positive, textAlign: "right" }}>{r[4]}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: NT.mono, fontSize: 11.5, color: NT.text4, marginTop: 16 }}>
        Net of electricity (Common Compute subtracts measured wall-power draw at your local utility rate).
      </div>
    </div>
  </section>
);

const PROMISES: Array<[string, string]> = [
  ["No foreground impact", "The agent yields instantly when you touch the keyboard, trackpad, or run a demanding app. You won't notice it."],
  ["Never touches your files", "Tasks run in a signed, ephemeral sandbox with no access to your disk, network shares, or keychain."],
  ["Thermal safety", "Workloads throttle before your Mac gets warm. You set the ceiling. Defaults keep it cool and quiet."],
  ["Transparent earnings", "Every task is signed and ledgered. You can audit every cent and see exactly what ran when."],
  ["Pause at any time", "One click in the menu bar or a hotkey stops everything. No contracts, no commitments."],
  ["Electricity reimbursed", "We subtract measured wall-power at your utility rate so the number you see is net."],
];

const EarnPromises = () => (
  <section style={{ borderBottom: `1px solid ${NT.line}`, background: NT.panel }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display }}>
      <Eyebrow>Promises</Eyebrow>
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
        Your machine. Your rules.
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
        {PROMISES.map(([k, v]) => (
          <div key={k} style={{ padding: 28, background: NT.panel }}>
            <div style={{ fontSize: 16, color: NT.text, fontWeight: 500, letterSpacing: -0.2, marginBottom: 10 }}>{k}</div>
            <div style={{ fontSize: 13.5, color: NT.text2, lineHeight: 1.55 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const EarnCTA = () => (
  <section style={{ background: NT.bg }}>
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 32px", fontFamily: NT.display, textAlign: "center" }}>
      <h2
        className="cc-shimmer"
        style={{ fontSize: 56, letterSpacing: -2.2, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.02 }}
      >
        Turn idle into income.
      </h2>
      <p style={{ fontSize: 17, color: NT.text2, margin: "0 auto 32px", maxWidth: 520, lineHeight: 1.55 }}>
        Ten-minute setup. First payout in seven days. Cancel with one click.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link
          href="/download"
          style={N_btnPrimary({ padding: "14px 22px", fontSize: 14, background: NT.blue, color: "#0A0C10" })}
        >
          Download for macOS
        </Link>
        <Link href="/docs" style={N_btnGhost({ padding: "14px 22px", fontSize: 14 })}>Provider docs</Link>
      </div>
    </div>
  </section>
);

export default function ProvidersPage() {
  return (
    <>
      <EarnHero />
      <EarnHow />
      <EarnEarnings />
      <EarnPromises />
      <EarnCTA />
    </>
  );
}
