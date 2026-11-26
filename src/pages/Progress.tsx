import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { THEMES, themeCardId } from "../data/themes.ts";
import { localDate, shiftDate } from "../lib/dates.ts";
import { isLearned } from "../lib/srs.ts";
import { POS_LABEL, type Pos } from "../lib/types.ts";
import { streakNow } from "../context.tsx";

export function Progress() {
  const { corpus, cards, reviews, activity, meta } = useApp();
  const learned = corpus.words.filter((word) => isLearned(cards.get(word.id)));
  const recent = reviews.filter((review) => review.ts >= Date.now() - 30 * 86_400_000);
  const accuracy = recent.length ? Math.round((recent.filter((review) => review.correct).length / recent.length) * 100) : null;
  const byPos = (Object.keys(POS_LABEL) as Pos[]).map((pos) => {
    const slice = recent.filter((review) => corpus.words.find((word) => word.id === review.cardId)?.pos === pos);
    const correct = slice.filter((review) => review.correct).length;
    return { pos, total: slice.length, correct };
  }).filter((row) => row.total > 0);
  const byTheme = THEMES.map((theme) => {
    const ids = new Set(theme.items.map((item) => themeCardId(theme.id, item)));
    const slice = recent.filter((review) => ids.has(review.cardId));
    const known = theme.items.filter((item) => isLearned(cards.get(themeCardId(theme.id, item)))).length;
    return { theme, total: slice.length, correct: slice.filter((review) => review.correct).length, known };
  }).filter((row) => row.known > 0 || row.total > 0);
  const weakest = corpus.words
    .filter((word) => word.pos === "verb")
    .map((word) => ({ word, card: cards.get(word.id) }))
    .filter((row) => (row.card?.lapses ?? 0) > 0)
    .sort((a, b) => (b.card?.lapses ?? 0) - (a.card?.lapses ?? 0) || (a.card?.ease ?? 3) - (b.card?.ease ?? 3))
    .slice(0, 8);
  const tenseCounts = new Map<string, { total: number; correct: number }>();
  for (const review of recent) {
    if (!review.mode.startsWith("conj:")) continue;
    const tense = review.mode.slice(5);
    const row = tenseCounts.get(tense) ?? { total: 0, correct: 0 };
    row.total += 1;
    if (review.correct) row.correct += 1;
    tenseCounts.set(tense, row);
  }
  const tenses = [...tenseCounts.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total);
  const today = localDate();
  const days = Array.from({ length: 28 }, (_, index) => shiftDate(today, index - 27));
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Progress</p>
        <h1>Progress</h1>
        <p className="lede">{streakNow(meta) > 0 ? `${streakNow(meta)}-day streak` : "No streak yet"} · {learned.length.toLocaleString()} words learned · {accuracy === null ? "no reviews yet" : `${accuracy}% right over 30 days`}</p>
      </header>
      <section className="panel">
        <h2>Last four weeks</h2>
        <div className="band-list">
          {days.map((day) => {
            const fromReviews = reviews.filter((review) => localDate(new Date(review.ts)) === day);
            const stat = activity[day] ?? { reviews: fromReviews.length, correct: fromReviews.filter((review) => review.correct).length };
            return (
              <div className="band" key={day}>
                <span>{day.slice(5)}</span>
                <div className="track" aria-hidden="true"><i style={{ width: `${Math.min(100, stat.reviews * 8)}%` }} /></div>
                <span className="muted">{stat.reviews}</span>
              </div>
            );
          })}
        </div>
      </section>
      {byPos.length > 0 && (
        <section className="panel">
          <h2>Accuracy by word type</h2>
          {byPos.map((row) => (
            <div className="band" key={row.pos}>
              <span>{POS_LABEL[row.pos]}</span>
              <div className="track"><i style={{ width: `${(row.correct / row.total) * 100}%` }} /></div>
              <span className="muted">{Math.round((row.correct / row.total) * 100)}%</span>
            </div>
          ))}
        </section>
      )}
      {byTheme.length > 0 && (
        <section className="panel stack">
          <h2>Themes</h2>
          {byTheme.map((row) => (
            <Link key={row.theme.id} className="hit" to={`/themes/${row.theme.id}`}>
              <span className="rank">{row.known}</span>
              <span><b>{row.theme.title}</b><small>{row.total ? `${Math.round((row.correct / row.total) * 100)}% recent` : "not reviewed yet"}</small></span>
              <small>{row.theme.items.length}</small>
            </Link>
          ))}
        </section>
      )}
      <section className="panel stack">
        <h2>Weakest verbs</h2>
        {weakest.length === 0 && <p className="muted">Miss a verb twice and it will show up here.</p>}
        {weakest.map(({ word, card }) => (
          <Link key={word.id} className="hit" to={`/word/${encodeURIComponent(word.id)}`}>
            <span className="rank">{card?.lapses}</span>
            <span><b>{word.lemma}</b><small>{word.gloss}</small></span>
            <small>{card?.ease.toFixed(2)}</small>
          </Link>
        ))}
      </section>
      <section className="panel stack">
        <h2>Weakest tenses</h2>
        {tenses.length === 0 && <p className="muted">Drill verb forms and the tenses you miss will show up here.</p>}
        {tenses.map(([tense, row]) => (
          <div className="band" key={tense}>
            <span>{tense}</span>
            <div className="track"><i style={{ width: `${(row.correct / row.total) * 100}%` }} /></div>
            <span className="muted">{row.correct}/{row.total}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
