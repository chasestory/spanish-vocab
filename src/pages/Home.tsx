import { useMemo } from "react";
import { Link } from "react-router-dom";
import { streakNow, useApp } from "../context.tsx";
import { isLearned } from "../lib/srs.ts";
import { buildSession, selectionSummary } from "../lib/session.ts";

export function Home() {
  const { corpus, cards, settings, filters, meta } = useApp();
  const now = Date.now();
  const queue = useMemo(
    () => buildSession(corpus.words, corpus.phrases, cards, filters, Math.max(0, settings.newPerDay - meta.newToday), now, settings.region),
    [corpus.words, corpus.phrases, cards, filters, settings.newPerDay, settings.region, meta.newToday, now],
  );
  const due = queue.filter((card) => {
    const state = cards.get(card.id);
    return state && state.status !== "new" && state.due <= now;
  }).length;
  const goal = Math.max(1, settings.dailyGoal);
  const done = Math.min(meta.reviewsToday, goal);
  const streak = streakNow(meta);
  const learned = corpus.words.filter((word) => isLearned(cards.get(word.id))).length;
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Today</p>
        <h1>{streak === 1 ? "1 day" : `${streak} days`}</h1>
        <p className="lede">{done} of {goal} reviews · {learned.toLocaleString()} words learned</p>
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
          <h2 style={{ marginBottom: 4 }}>{due ? `${due} due now` : queue.length ? `${queue.length} cards ready` : "Nothing to study"}</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {selectionSummary(filters)}
          </p>
        </div>
      </section>
      <Link className="btn primary huge" to="/study?start=1">Start</Link>
      <p className="muted">Start mixes what’s due with a few new cards from the selection you saved.</p>
      <Link className="back" to="/study">Change what to study</Link>
    </div>
  );
}
