import Link from "next/link";
import { NT } from "./tokens";
import { DOCS_NAV, DOCS_CONTENT, type DocBlock } from "./docs-content";

const DocsCode = ({ lang, text }: { lang: string; text: string }) => (
  <div
    style={{
      border: `1px solid ${NT.line}`,
      borderRadius: 8,
      overflow: "hidden",
      background: NT.panel2,
      margin: "14px 0 18px",
    }}
  >
    <div
      style={{
        padding: "8px 14px",
        borderBottom: `1px solid ${NT.line}`,
        fontFamily: NT.mono,
        fontSize: 10.5,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: NT.text3,
      }}
    >
      {lang}
    </div>
    <pre
      style={{
        margin: 0,
        padding: "14px 16px",
        fontFamily: NT.mono,
        fontSize: 12.5,
        lineHeight: 1.7,
        color: NT.text,
        overflow: "auto",
        background: "transparent",
      }}
    >
      {text}
    </pre>
  </div>
);

const DocsBody = ({ slug }: { slug: string }) => {
  const entry = DOCS_CONTENT[slug] || DOCS_CONTENT["intro"];
  return (
    <article style={{ fontFamily: NT.display, maxWidth: 720 }}>
      <div
        style={{
          fontFamily: NT.mono,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: NT.text3,
          marginBottom: 10,
        }}
      >
        {entry.kicker}
      </div>
      <h1
        style={{
          fontSize: 40,
          letterSpacing: -1.6,
          fontWeight: 500,
          color: NT.text,
          margin: "0 0 28px",
          lineHeight: 1.05,
        }}
      >
        {entry.title}
      </h1>
      {entry.body.map((b: DocBlock, i: number) => {
        if (b.kind === "p")
          return (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: NT.text2, margin: "0 0 18px" }}>
              {b.text}
            </p>
          );
        if (b.kind === "h")
          return (
            <h2
              key={i}
              style={{
                fontSize: 22,
                letterSpacing: -0.6,
                fontWeight: 500,
                color: NT.text,
                margin: "32px 0 14px",
              }}
            >
              {b.text}
            </h2>
          );
        if (b.kind === "ul")
          return (
            <ul key={i} style={{ margin: "0 0 18px", paddingLeft: 20 }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ fontSize: 15, lineHeight: 1.75, color: NT.text2, marginBottom: 6 }}>
                  {it}
                </li>
              ))}
            </ul>
          );
        if (b.kind === "code") return <DocsCode key={i} lang={b.lang} text={b.text} />;
        if (b.kind === "callout") {
          const col = b.tone === "green" ? NT.positive : NT.blue;
          return (
            <div
              key={i}
              style={{
                borderLeft: `2px solid ${col}`,
                background: NT.panel,
                padding: "14px 18px",
                borderRadius: "0 6px 6px 0",
                margin: "18px 0",
                fontSize: 13.5,
                color: NT.text2,
                lineHeight: 1.55,
              }}
            >
              {b.text}
            </div>
          );
        }
        return null;
      })}
    </article>
  );
};

export default function DocsLayout({ slug }: { slug: string }) {
  const active = slug;
  return (
    <div
      style={{
        background: NT.bg,
        color: NT.text,
        fontFamily: NT.display,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "56px 32px 96px",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 88,
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          {DOCS_NAV.map((sec) => (
            <div key={sec.section}>
              <div
                style={{
                  fontFamily: NT.mono,
                  fontSize: 10.5,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: NT.text3,
                  marginBottom: 10,
                }}
              >
                {sec.section}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {sec.items.map((it) => {
                  const isActive = active === it.id;
                  return (
                    <Link
                      key={it.id}
                      href={`/docs/${it.id}`}
                      style={{
                        fontSize: 13.5,
                        color: isActive ? NT.text : NT.text3,
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 4,
                        background: isActive ? NT.panel : "transparent",
                        borderLeft: isActive ? `2px solid ${NT.blue}` : "2px solid transparent",
                        marginLeft: -2,
                        transition: "all 0.1s",
                      }}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>
        <DocsBody slug={slug} />
      </div>
    </div>
  );
}
