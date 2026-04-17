function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderHomepage(): string {
  const title = "CommonCompute | Trust-First AI GPU Marketplace";
  const description =
    "Rent reliable GPUs for AI inference and training, or earn by supplying verified compute. Built with Cloudflare-native control plane orchestration.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://commoncompute.ai" />
    <meta name="theme-color" content="#0f766e" />
    <style>
      :root {
        --ink: #092126;
        --ink-soft: #29444a;
        --surface: #f5fbfc;
        --card: #ffffff;
        --line: #c8e3e6;
        --teal: #0f766e;
        --mint: #d7f3f0;
        --orange: #de6b35;
        --yellow: #f2b84b;
        --shadow: 0 14px 32px rgba(5, 48, 55, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Nunito Sans", "Trebuchet MS", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(1000px 400px at 100% -10%, #e2f7f4, transparent 70%),
          radial-gradient(900px 360px at -10% -20%, #ffe5d5, transparent 70%),
          var(--surface);
      }

      .wrap {
        max-width: 1120px;
        margin: 0 auto;
        padding: 22px;
      }

      .nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
      }

      .brand {
        display: inline-flex;
        gap: 10px;
        align-items: center;
        font-weight: 800;
        letter-spacing: 0.2px;
      }

      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background:
          conic-gradient(from 215deg, var(--orange), var(--yellow), #57b7ae, var(--teal), var(--orange));
      }

      .hero {
        margin-top: 38px;
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 22px;
      }

      .panel {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }

      .hero-copy {
        padding: 34px;
      }

      .eyebrow {
        display: inline-block;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1.1px;
        color: var(--teal);
        background: var(--mint);
        border: 1px solid #97d7d0;
        padding: 7px 10px;
        border-radius: 999px;
      }

      h1 {
        margin: 14px 0 12px;
        line-height: 1.04;
        font-size: clamp(2.1rem, 4.4vw, 3.6rem);
      }

      .lead {
        margin: 0;
        line-height: 1.5;
        color: var(--ink-soft);
      }

      .cta-row {
        margin-top: 22px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        padding: 10px 14px;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--teal);
        color: #f2fffd;
      }

      .btn-secondary {
        border-color: #9ad7d1;
        background: #ecfcfa;
        color: #0f5853;
      }

      .status {
        padding: 24px;
        display: grid;
        gap: 14px;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .stat {
        padding: 12px;
        border-radius: 12px;
        background: #f8fdfd;
        border: 1px solid var(--line);
      }

      .k {
        font-size: 1.3rem;
        font-weight: 800;
      }

      .label {
        margin-top: 4px;
        font-size: 0.83rem;
        color: var(--ink-soft);
      }

      .strip {
        margin-top: 16px;
        padding: 12px;
        border-radius: 12px;
        font-size: 0.92rem;
        background: #fff5ec;
        border: 1px solid #f8c99d;
      }

      .cards {
        margin-top: 22px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .card {
        padding: 18px;
      }

      .card h3 {
        margin: 8px 0;
      }

      .card p {
        margin: 0;
        color: var(--ink-soft);
        line-height: 1.45;
      }

      .footer {
        margin: 24px 0 10px;
        text-align: center;
        font-size: 0.88rem;
        color: var(--ink-soft);
      }

      @keyframes lift {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .panel,
      .card {
        animation: lift 0.45s ease both;
      }

      .hero .panel:nth-child(2) {
        animation-delay: 0.08s;
      }

      .cards .card:nth-child(2) {
        animation-delay: 0.12s;
      }

      .cards .card:nth-child(3) {
        animation-delay: 0.18s;
      }

      @media (max-width: 960px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .cards {
          grid-template-columns: 1fr;
        }

        .stat-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header class="nav">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>CommonCompute</span>
        </div>
        <a class="btn btn-secondary" href="/app">Customer App</a>
      </header>

      <main>
        <section class="hero">
          <article class="panel hero-copy">
            <span class="eyebrow">Trust-First AI Compute</span>
            <h1>Rent or supply GPUs for inference and training.</h1>
            <p class="lead">
              CommonCompute is a Cloudflare-native control plane for verified GPU providers. Jobs are matched with hard
              compatibility filters, reliability-weighted scoring, reservation failover, and payout controls.
            </p>
            <div class="cta-row">
              <a class="btn btn-primary" href="/app">Launch Customer App</a>
              <a class="btn btn-secondary" href="https://api.commoncompute.ai/healthz">API Status</a>
            </div>
          </article>

          <aside class="panel status">
            <strong>Live Platform Surface</strong>
            <div class="stat-grid">
              <div class="stat">
                <div class="k">3</div>
                <div class="label">Event Queues</div>
              </div>
              <div class="stat">
                <div class="k">2</div>
                <div class="label">Durable Objects</div>
              </div>
              <div class="stat">
                <div class="k">1</div>
                <div class="label">Training Workflow</div>
              </div>
            </div>
            <div class="strip">
              Security defaults: provider KYC required before paid jobs, signed agent identity, and no-egress by default.
            </div>
          </aside>
        </section>

        <section class="cards">
          <article class="panel card">
            <h3>Deterministic Scheduling</h3>
            <p>Hard filters first, then reliability-aware scoring for placement, with standby candidates for critical jobs.</p>
          </article>

          <article class="panel card">
            <h3>Audit-Centered Ops</h3>
            <p>Allocation, usage, billing, and compliance events are stored for full payout and trust-path reconstruction.</p>
          </article>

          <article class="panel card">
            <h3>Cross-Platform Supply</h3>
            <p>Provider agent scaffolding supports Linux, Windows (WSL2), and macOS (limited Metal profile).</p>
          </article>
        </section>
      </main>

      <footer class="footer">
        <span>CommonCompute AI • API: </span>
        <a href="https://api.commoncompute.ai">api.commoncompute.ai</a>
      </footer>
    </div>
  </body>
</html>`;
}
