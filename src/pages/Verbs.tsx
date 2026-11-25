import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { conjugate } from "../lib/conjugate.ts";
import { searchMatch } from "../lib/deck.ts";

export function Verbs() {
  const { corpus, setFilters, filters } = useApp();
  const [query, setQuery] = useState("");
  const [irregular, setIrregular] = useState(true);
  const verbs = useMemo(() => {
    return corpus.words.filter((word) => {
      if (word.pos !== "verb") return false;
      const paradigm = conjugate(word.lemma);
      if (irregular && paradigm?.kind === "regular") return false;
      return searchMatch(query, word.lemma, word.gloss);
    }).slice(0, 80);
  }, [corpus.words, query, irregular]);
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Verbs</p>
        <h1>Conjugations</h1>
        <p className="lede">Open a verb for every tense. Drill the forms from Study.</p>
      </header>
      <Link
        className="btn primary"
        to="/study?start=1"
        onClick={() => setFilters({ ...filters, sets: ["verbs"], irregularOnly: irregular, poses: ["verb"] })}
      >
        Drill {irregular ? "irregular" : "these"} verbs
      </Link>
      <input type="search" placeholder="Search a verb" value={query} onChange={(event) => setQuery(event.target.value)} />
      <button className={`chip${irregular ? " on" : ""}`} type="button" onClick={() => setIrregular((value) => !value)}>Irregular only</button>
      <div className="stack">
        {verbs.map((word) => {
          const paradigm = conjugate(word.lemma);
          return (
            <Link key={word.id} className="hit" to={`/word/${encodeURIComponent(word.id)}`}>
              <span className="rank">{word.rank}</span>
              <span><b>{word.lemma}</b><small>{word.gloss}</small></span>
              <small>{paradigm?.kind ?? ""}</small>
            </Link>
          );
        })}
      </div>
      <p className="muted">Showing {verbs.length}. Search to narrow the list.</p>
    </div>
  );
}
