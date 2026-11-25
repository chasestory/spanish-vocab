import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { searchMatch } from "../lib/deck.ts";
import { CATEGORIES } from "../lib/types.ts";

export function Phrases() {
  const { corpus, setFilters, filters, toggleStar, cards } = useApp();
  const [category, setCategory] = useState(filters.category || "all");
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
        <p className="eyebrow">Phrases</p>
        <h1>Everyday lines</h1>
        <p className="lede">{corpus.phrases.length.toLocaleString()} short lines that use common words.</p>
      </header>
      <div className="chips">
        {CATEGORIES.map((item) => (
          <button key={item.id} className={`chip${category === item.id ? " on" : ""}`} type="button" onClick={() => setCategory(item.id)}>{item.label}</button>
        ))}
      </div>
      <input type="search" placeholder="Search a phrase" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Link className="btn primary" to="/study?start=1" onClick={() => setFilters({ ...filters, sets: ["phrases"], source: "phrases", category })}>
        Study this set
      </Link>
      {items.length === 0 && <section className="panel"><h2>No phrases in this cut.</h2></section>}
      <div className="stack">
        {items.slice(0, 60).map((phrase) => {
          const starred = cards.get(phrase.id)?.starred ?? false;
          return (
            <article key={phrase.id} className="panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="chip">{phrase.category}</span>
                <button className={`btn star${starred ? " on" : ""}`} type="button" onClick={() => void toggleStar(phrase.id)}>{starred ? "Starred" : "Star"}</button>
              </div>
              <p className="gloss" style={{ marginTop: 8 }}>{phrase.es}</p>
              <p className="muted">{phrase.en}</p>
            </article>
          );
        })}
      </div>
      {items.length > 60 && <p className="muted">Showing 60 of {items.length}. Search to narrow them.</p>}
    </div>
  );
}
