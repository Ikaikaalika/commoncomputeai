import Link from "next/link";

interface Card {
  title: string;
  body: string;
  note?: string;
}

interface CTA {
  label: string;
  href: string;
}

interface ContentPageProps {
  eyebrow: string;
  headline: string;
  lead: string;
  cards: Card[];
  ctaPrimary?: CTA;
  ctaSecondary?: CTA;
}

export default function ContentPage({
  eyebrow,
  headline,
  lead,
  cards,
  ctaPrimary,
  ctaSecondary,
}: ContentPageProps) {
  return (
    <>
      <section className="content-hero">
        <div className="container content-hero-inner">
          <span className="eyebrow subtle">{eyebrow}</span>
          <h1>{headline}</h1>
          <p className="lede">{lead}</p>
          {(ctaPrimary || ctaSecondary) && (
            <div className="hero-actions" style={{ marginTop: 24 }}>
              {ctaPrimary && (
                <Link href={ctaPrimary.href} className="button">
                  {ctaPrimary.label}
                </Link>
              )}
              {ctaSecondary && (
                <Link href={ctaSecondary.href} className="button secondary">
                  {ctaSecondary.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="container section">
        <div className="trust-grid">
          {cards.map((card) => (
            <article key={card.title} className="feature-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              {card.note && (
                <p className="card-note" style={{ marginTop: 8, fontSize: "0.88rem" }}>
                  {card.note}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
