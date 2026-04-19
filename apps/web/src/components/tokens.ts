import type { CSSProperties } from "react";

export const NT = {
  bg: "#0A0C10",
  panel: "#10131A",
  panel2: "#151923",
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.05)",
  text: "#ECEEF1",
  text2: "#B4B9C2",
  text3: "#7F8590",
  text4: "#555A64",
  silver1: "#D5DCE4",
  silver2: "#AEB5BE",
  silver3: "#868E97",
  blue: "#8EC9F8",
  blueDeep: "#5DA8EC",
  positive: "#7EE2A8",
  display: 'var(--font-display), "Inter Tight", Inter, -apple-system, sans-serif',
  mono: 'var(--font-mono), "JetBrains Mono", ui-monospace, monospace',
};

export const N_link = (s: CSSProperties = {}): CSSProperties => ({
  color: NT.text2,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: NT.display,
  fontSize: 13.5,
  ...s,
});

export const N_btnPrimary = (s: CSSProperties = {}): CSSProperties => ({
  background: NT.text,
  color: "#0A0C10",
  border: "none",
  padding: "9px 14px",
  borderRadius: 6,
  fontFamily: NT.display,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  letterSpacing: -0.1,
  textDecoration: "none",
  display: "inline-block",
  ...s,
});

export const N_btnGhost = (s: CSSProperties = {}): CSSProperties => ({
  background: "transparent",
  color: NT.text,
  border: `1px solid ${NT.line}`,
  padding: "9px 14px",
  borderRadius: 6,
  fontFamily: NT.display,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  ...s,
});
