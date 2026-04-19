import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import { NT, N_btnPrimary, N_btnGhost } from "@/components/tokens";

export const metadata: Metadata = {
  title: "Download Common Compute",
  description: "Download the macOS menu-bar app. Run sandboxed AI workloads on your idle Mac and get paid weekly.",
};

const RELEASE = {
  version: "1.1.0",
  date: "April 2026",
  size: "2.4 MB",
  minOS: "macOS 14 Sonoma",
  archs: "Apple Silicon & Intel",
  dmgPath: "/downloads/CommonCompute-1.1.0.dmg",
};

export default function DownloadPage() {
  return (
    <section style={{ background: NT.bg, minHeight: "70vh", borderBottom: `1px solid ${NT.line}` }}>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "120px 32px",
          fontFamily: NT.display,
          textAlign: "center",
        }}
      >
        <Eyebrow>Free download · macOS</Eyebrow>
        <h1
          className="cc-shimmer"
          style={{
            fontSize: 64,
            letterSpacing: -2.4,
            fontWeight: 500,
            margin: "20px 0 20px",
            lineHeight: 1.02,
          }}
        >
          Download Common Compute.
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: NT.text2,
            maxWidth: 560,
            margin: "0 auto 36px",
          }}
        >
          A signed, notarised menu-bar app. Quietly runs sandboxed AI workloads on your Mac when it&apos;s idle and on
          power. Pauses instantly when you touch the keyboard.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={RELEASE.dmgPath}
            style={N_btnPrimary({
              padding: "14px 22px",
              fontSize: 14,
              background: NT.blue,
              color: "#0A0C10",
            })}
          >
            Download for macOS · v{RELEASE.version}
          </a>
          <Link href="/providers" style={N_btnGhost({ padding: "14px 22px", fontSize: 14 })}>
            How it works
          </Link>
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 18,
            color: NT.text3,
            fontFamily: NT.mono,
            fontSize: 11.5,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <span>{RELEASE.size}</span>
          <span style={{ color: NT.text4 }}>·</span>
          <span>{RELEASE.minOS}+</span>
          <span style={{ color: NT.text4 }}>·</span>
          <span>{RELEASE.archs}</span>
          <span style={{ color: NT.text4 }}>·</span>
          <span>Released {RELEASE.date}</span>
        </div>
      </div>
    </section>
  );
}
