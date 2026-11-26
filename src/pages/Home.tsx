import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Intro } from "../components/Intro.tsx";
import { streakNow, useApp } from "../context.tsx";
import { buildSession } from "../lib/session.ts";

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
  const ready = due ? `${due} due` : queue.length ? `${queue.length} ready` : "Nothing waiting";
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Today</p>
        <h1>Start</h1>
      </header>
      <Link className="btn primary huge today-start" to="/study?start=1">Start</Link>
      <p className="lede">{done} of {goal} today · {streak > 0 ? `${streak}-day streak` : "No streak yet"} · {ready}</p>
      <Link className="back" to="/study">Change this mix</Link>
      <Intro />
    </div>
  );
}
