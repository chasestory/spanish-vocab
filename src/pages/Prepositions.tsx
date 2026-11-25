import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { PREPOSITIONS } from "../data/prepositions.ts";
import { searchMatch } from "../lib/deck.ts";

export function Prepositions() {
  const { setFilters, filters } = useApp();
  const [query, setQuery] = useState("");
  const [prep, setPrep] = useState("all");
  const preps = [...new Set(PREPOSITIONS.map((entry) => entry.prep))].sort();
  const items = useMemo(() => {
    return PREPOSITIONS.filter((entry) => {
      if (prep !== "all" && entry.prep !== prep) return false;
      return searchMatch(query, `${entry.verb} ${entry.prep} ${entry.example}`, entry.gloss);
    });
  }, [query, prep]);
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Verbs</p>
        <h1>Verb + preposition</h1>
        <p className="lede">The little word that has to follow the verb. Meaning changes are called out.</p>
      </header>
      <Link className="btn primary" to="/study?start=1" onClick={() => setFilters({ ...filters, sets: ["prepositions"] })}>
        Practice the preposition
      </Link>
      <input type="search" placeholder="Search pensar, depend, dream…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="chips">
        <button className={`chip${prep === "all" ? " on" : ""}`} type="button" onClick={() => setPrep("all")}>All</button>
        {preps.map((item) => (
          <button key={item} className={`chip${prep === item ? " on" : ""}`} type="button" onClick={() => setPrep(item)}>{item}</button>
        ))}
      </div>
      <p className="muted">{items.length} patterns</p>
      <div className="stack">
        {items.map((entry) => (
          <article key={entry.id} className="panel stack">
            <h2 style={{ margin: 0 }}>{entry.verb} {entry.prep}</h2>
            <p style={{ margin: 0 }}>{entry.gloss}</p>
            <p className="muted" style={{ margin: 0 }}>{entry.pattern}</p>
            <blockquote className="example">
              <p>{entry.example}</p>
              <p className="en">{entry.exampleEn}</p>
            </blockquote>
            {entry.contrast && <p className="muted">{entry.contrast}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
