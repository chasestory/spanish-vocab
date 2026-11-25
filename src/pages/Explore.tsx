import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { PREPOSITIONS } from "../data/prepositions.ts";
import { THEMES } from "../data/themes.ts";
import { searchMatch } from "../lib/deck.ts";

const LINKS = [
  { to: "/words", title: "Words", detail: "All 5,000 lemmas, with gender" },
  { to: "/themes", title: "Themes", detail: "Rooms, trails, food, work" },
  { to: "/verbs", title: "Verbs", detail: "Full conjugations" },
  { to: "/phrases", title: "Phrases", detail: "2,000 short lines" },
  { to: "/prepositions", title: "Verb + preposition", detail: "pensar en, depender de" },
  { to: "/pronouns", title: "Pronouns", detail: "lo, le, and se lo" },
  { to: "/grammar", title: "Grammar", detail: "Short lessons and drills" },
  { to: "/saved", title: "My words", detail: "Starred, plus anything you keep missing" },
];

export function Explore() {
  const { corpus, cards } = useApp();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return {
      words: corpus.words.filter((word) => searchMatch(q, word.lemma, word.gloss)).slice(0, 20),
      phrases: corpus.phrases.filter((phrase) => searchMatch(q, phrase.es, phrase.en)).slice(0, 8),
      themes: THEMES.flatMap((theme) => theme.items.filter((item) => searchMatch(q, item.es, item.en) || searchMatch(q, theme.title, item.en)).map((item) => ({ theme, item }))).slice(0, 8),
      preps: PREPOSITIONS.filter((entry) => searchMatch(q, `${entry.verb} ${entry.prep}`, entry.gloss)).slice(0, 8),
    };
  }, [query, corpus.words, corpus.phrases]);
  const stars = [...cards.values()].filter((card) => card.starred).length;
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Explore</p>
        <h1>Find anything</h1>
      </header>
      <input type="search" placeholder="Search Spanish or English" value={query} onChange={(event) => setQuery(event.target.value)} />
      {results ? (
        <div className="stack">
          {results.words.length + results.phrases.length + results.themes.length + results.preps.length === 0 && (
            <section className="panel"><h2>No matches</h2><p className="muted">Try the English, or drop the accent.</p></section>
          )}
          {results.words.map((word) => (
            <Link key={word.id} className="hit" to={`/word/${encodeURIComponent(word.id)}`}>
              <span className="rank">{word.rank}</span>
              <span><b>{word.lemma}</b><small>{word.gloss}</small></span>
              <small>{word.pos}</small>
            </Link>
          ))}
          {results.phrases.map((phrase) => (
            <Link key={phrase.id} className="hit" to="/phrases">
              <span className="rank"> </span>
              <span><b>{phrase.es}</b><small>{phrase.en}</small></span>
              <small>phrase</small>
            </Link>
          ))}
          {results.themes.map(({ theme, item }) => (
            <Link key={`${theme.id}-${item.es}`} className="hit" to={`/themes/${theme.id}`}>
              <span className="rank"> </span>
              <span><b>{item.es}</b><small>{item.en}</small></span>
              <small>{theme.title}</small>
            </Link>
          ))}
          {results.preps.map((entry) => (
            <Link key={entry.id} className="hit" to="/prepositions">
              <span className="rank">{entry.prep}</span>
              <span><b>{entry.verb}</b><small>{entry.gloss}</small></span>
              <small>prep</small>
            </Link>
          ))}
        </div>
      ) : (
        <div className="stack">
          {LINKS.map((link) => (
            <Link key={link.to} className="pick" to={link.to}>
              <span><b>{link.title}</b><small>{link.detail}</small></span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
          <p className="muted">{stars} starred · struggling words show up under My words after two misses.</p>
        </div>
      )}
    </div>
  );
}
