import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { searchMatch } from "../lib/deck.ts";
import { speakSpanish } from "../lib/speech.ts";
import { CATEGORIES } from "../lib/types.ts";

export function Phrases() {
  const { corpus, settings, setFilters, filters } = useApp();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    return corpus.phrases.filter((phrase) => {
      if (category !== "all" && phrase.category !== category) return false;
      return searchMatch(query, phrase.es, phrase.en);
    });
  }, [corpus.phrases, category, query]);
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Tatoeba</p>
        <h1>Everyday phrases</h1>
        <p className="lede">{corpus.phrases.length.toLocaleString()} short lines, chosen because they use common words.</p>
      </header>
      <div className="chips">
        {CATEGORIES.map((item) => (
          <button key={item.id} className={`chip${category === item.id ? " on" : ""}`} type="button" onClick={() => setCategory(item.id)}>{item.label}</button>
        ))}
      </div>
      <input type="search" placeholder="Search a phrase" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Link
        className="btn primary"
        to="/study"
        style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}
        onClick={() => setFilters({ ...filters, source: "phrases", category, mode: filters.mode })}
      >
        Study this set
      </Link>
      {items.length === 0 ? <section className="panel"><h2>No phrases in this cut.</h2></section> : null}
      <div style={{ display: "grid", gap: 8 }}>
        {items.slice(0, 80).map((phrase) => (
          <article key={phrase.id} className="panel">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="chip">{phrase.category}</span>
              <button className="icon-btn" type="button" aria-label="Play phrase" onClick={() => speakSpanish(phrase.es, settings)}>♪</button>
            </div>
            <p className="gloss" style={{ marginTop: 8 }}>{phrase.es}</p>
            <p className="muted">{phrase.en}</p>
          </article>
        ))}
      </div>
      {items.length > 80 && <p className="muted">Showing 80 of {items.length}. Search to narrow them.</p>}
    </div>
  );
}
