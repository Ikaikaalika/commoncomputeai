import Link from "next/link";
import Eyebrow from "./Eyebrow";
import { NT, N_btnGhost } from "./tokens";

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export default function SimplePage({ eyebrow, title, body, cta }: Props) {
  return (
    <section style={{ background: NT.bg, minHeight: "60vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "120px 32px", fontFamily: NT.display }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          style={{
            fontSize: 56,
            letterSpacing: -2.2,
            fontWeight: 500,
            color: NT.text,
            margin: "18px 0 24px",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: NT.text2, maxWidth: 640 }}>{body}</p>
        {cta && (
          <div style={{ marginTop: 32 }}>
            <Link href={cta.href} style={N_btnGhost({ padding: "12px 18px", fontSize: 14 })}>
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
