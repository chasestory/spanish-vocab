import { Link } from "react-router-dom";
import { streakNow, useApp } from "../context.tsx";
import { isLearned } from "../lib/srs.ts";

const BANDS = [
  { label: "Top 100", min: 1, max: 100 },
  { label: "101–500", min: 101, max: 500 },
  { label: "501–1k", min: 501, max: 1000 },
  { label: "1k–2k", min: 1001, max: 2000 },
  { label: "2k–3k", min: 2001, max: 3000 },
  { label: "3k–5k", min: 3001, max: 5000 },
];

export function Home() {
  const { corpus, cards, reviews, settings, meta } = useApp();
  const now = Date.now();
  const week = now - 7 * 86_400_000;
  const recent = reviews.filter((review) => review.ts >= week);
  const accuracy = recent.length ? Math.round((recent.filter((review) => review.correct).length / recent.length) * 100) : null;
  const due = [...cards.values()].filter((card) => card.status !== "new" && card.due <= now).length;
  const learned = corpus.words.filter((word) => isLearned(cards.get(word.id))).length;
  const goal = Math.max(1, settings.dailyGoal);
  const done = Math.min(meta.reviewsToday, goal);
  const streak = streakNow(meta);
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Spanish by frequency</p>
        <h1>Hola, Chase.</h1>
        <p className="lede">The 5,000 Spanish words people actually say, from the most common on down. No account. It keeps working on the train.</p>
      </header>
      <section className="card goal">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r="38" fill="none" stroke="var(--chip)" strokeWidth="8" />
          <circle
            cx="46"
            cy="46"
            r="38"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(done / goal) * 239} 239`}
            transform="rotate(-90 46 46)"
          />
          <text x="46" y="51" textAnchor="middle" fill="var(--ink)" fontSize="18" fontFamily="var(--serif)">
            {done}/{goal}
          </text>
        </svg>
        <div>
          <h2 style={{ marginBottom: 4 }}>{streak === 1 ? "1-day streak" : `${streak}-day streak`}</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {due} due now · {Math.max(0, settings.newPerDay - meta.newToday)} new cards left today
          </p>
          <Link className="btn primary" to="/study" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>
            Study now
          </Link>
        </div>
      </section>
      <section className="stat-grid">
        <div className="stat"><b>{learned}</b><span>words learned</span></div>
        <div className="stat"><b>{accuracy === null ? "—" : `${accuracy}%`}</b><span>accuracy, 7 days</span></div>
        <div className="stat"><b>{corpus.words.length.toLocaleString()}</b><span>lemmas in the deck</span></div>
      </section>
      <section className="panel">
        <h2>Learned by band</h2>
        <div className="band-list">
          {BANDS.map((band) => {
            const slice = corpus.words.filter((word) => word.rank >= band.min && word.rank <= band.max);
            const known = slice.filter((word) => isLearned(cards.get(word.id))).length;
            const pct = slice.length ? (known / slice.length) * 100 : 0;
            return (
              <div className="band" key={band.label}>
                <span>{band.label}</span>
                <div className="track" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
                <span className="muted">{known}/{slice.length}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
