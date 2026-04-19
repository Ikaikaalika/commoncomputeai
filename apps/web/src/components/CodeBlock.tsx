import { NT } from "./tokens";

export const clr = {
  kw: NT.blue,
  str: "#9FE6B8",
  num: "#E4B86E",
  com: NT.text4,
  fn: "#C9A7F0",
  prop: NT.text,
};

export const hl = (parts: Array<[string, string | null]>) =>
  parts.map(([t, c]) => (c ? `<span style="color:${c}">${t}</span>` : t)).join("");

type Props = { lang?: string; lines: string[]; title?: string };

export default function CodeBlock({ lang = "python", lines, title }: Props) {
  return (
    <div style={{ border: `1px solid ${NT.line}`, borderRadius: 10, overflow: "hidden", background: NT.panel }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${NT.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: NT.mono,
          fontSize: 11,
          color: NT.text3,
          letterSpacing: 0.3,
        }}
      >
        <span>{title}</span>
        <span style={{ textTransform: "uppercase", letterSpacing: 1 }}>{lang}</span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "18px 20px",
          fontFamily: NT.mono,
          fontSize: 12.5,
          lineHeight: 1.75,
          color: NT.text,
          background: "transparent",
          overflow: "auto",
        }}
      >
        {lines.map((line, i) => (
          <div key={i}>
            <span style={{ color: NT.text4, display: "inline-block", width: 22 }}>{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: line }} />
          </div>
        ))}
      </pre>
    </div>
  );
}
