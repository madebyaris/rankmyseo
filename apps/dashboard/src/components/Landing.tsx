const FEATURES = [
  {
    icon: "🔍",
    title: "Website scan",
    body: "Fetch any URL, extract on-page SEO signals, and score it against the audit rule engine in seconds.",
  },
  {
    icon: "🏷️",
    title: "Meta generator",
    body: "Generate a clean <title>, meta description, Open Graph tags, and JSON-LD — verified against the same audit rules.",
  },
  {
    icon: "✍️",
    title: "Blog system",
    body: "Draft posts with a target keyword and search intent. Meta is auto-generated when you leave it blank.",
  },
  {
    icon: "💡",
    title: "Recommendations",
    body: "Every scan and post returns prioritized, actionable fixes — high, medium, and low priority.",
  },
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="brand">
          <span className="brand-mark">◆</span> RankMySEO
        </span>
        <button className="btn btn-primary" onClick={onLaunch}>
          Open dashboard
        </button>
      </nav>

      <header className="hero">
        <span className="eyebrow">Open-source · Apache-2.0</span>
        <h1>
          The SEO toolkit you <span className="grad">drop into any app</span>
        </h1>
        <p className="hero-sub">
          Scan pages, generate meta tags, manage an intent-driven blog, and get
          recommendations — all powered by the framework-agnostic{" "}
          <code>@rankmyseo/*</code> packages, with your data in your database.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={onLaunch}>
            Launch the dashboard →
          </button>
          <a
            className="btn btn-ghost btn-lg"
            href="https://github.com/madebyaris/rankmyseo"
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        </div>
      </header>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <article className="feature" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        <span>Self-hosted · bring your own database · no paid SERP brokers</span>
      </footer>
    </div>
  );
}
