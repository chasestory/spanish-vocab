import { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GenderTag } from "../components/GenderTag.tsx";
import { useApp } from "../context.tsx";
import { searchMatch } from "../lib/deck.ts";
import { isIrregularVerb } from "../lib/conjugate.ts";
import type { GenderFilter, Pos, Word } from "../lib/types.ts";
import { POS_LABEL } from "../lib/types.ts";

const ROW = 76;

export function Browse() {
  const { corpus } = useApp();
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<Pos | "all">("all");
  const [band, setBand] = useState(5000);
  const [irregular, setIrregular] = useState(false);
  const [gender, setGender] = useState<GenderFilter>("all");
  const parent = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const [height, setHeight] = useState(640);

  const items = useMemo(() => {
    return corpus.words.filter((word) => {
      if (word.rank > band) return false;
      if (pos !== "all" && word.pos !== pos) return false;
      if (irregular && !(word.pos === "verb" && isIrregularVerb(word.lemma))) return false;
      if (gender !== "all" && word.pos === "noun" && word.gender !== gender && word.gender !== "mf") return false;
      if (gender !== "all" && word.pos !== "noun") return false;
      return searchMatch(query, word.lemma, word.gloss);
    });
  }, [corpus.words, query, pos, band, irregular, gender]);

  useEffect(() => {
    const el = parent.current;
    if (!el) return;
    const onScroll = () => setScroll(el.scrollTop);
    const observer = new ResizeObserver(() => setHeight(el.clientHeight));
    el.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const start = Math.max(0, Math.floor(scroll / ROW) - 8);
  const end = Math.min(items.length, Math.ceil((scroll + height) / ROW) + 8);

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Browse</p>
        <h1>All {corpus.words.length.toLocaleString()} lemmas</h1>
      </header>
      <input type="search" placeholder="Search café or house" value={query} onChange={(event) => { setQuery(event.target.value); parent.current?.scrollTo(0, 0); setScroll(0); }} />
      <div className="chips">
        <button className={`chip${pos === "all" ? " on" : ""}`} type="button" onClick={() => setPos("all")}>All</button>
        {(Object.entries(POS_LABEL) as [Pos, string][]).map(([id, label]) => (
          <button key={id} className={`chip${pos === id ? " on" : ""}`} type="button" onClick={() => setPos(id)}>{label}</button>
        ))}
      </div>
      <div className="row">
        <label className="field">Band
          <select value={band} onChange={(event) => setBand(Number(event.target.value))}>
            {[100, 500, 1000, 2000, 3000, 5000].map((value) => <option key={value} value={value}>Top {value}</option>)}
          </select>
        </label>
        <button className={`chip${irregular ? " on" : ""}`} type="button" onClick={() => setIrregular((value) => !value)}>Irregular verbs</button>
        {(["all", "m", "f"] as const).map((value) => (
          <button key={value} className={`chip${gender === value ? " on" : ""}`} type="button" onClick={() => setGender(value)}>
            {value === "all" ? "Any gender" : value === "m" ? "Masculine" : "Feminine"}
          </button>
        ))}
      </div>
      <p className="muted">{items.length.toLocaleString()} shown</p>
      {items.length === 0 ? (
        <section className="panel"><h2>No matches</h2><p className="muted">Try without the accent, or clear a filter.</p></section>
      ) : (
        <div className="list-scroll" ref={parent}>
          <div style={{ height: items.length * ROW, position: "relative" }}>
            {items.slice(start, end).map((word, offset) => (
              <WordRow key={word.id} word={word} top={(start + offset) * ROW} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WordRow({ word, top }: { word: Word; top: number }) {
  return (
    <Link className="hit" to={`/word/${encodeURIComponent(word.id)}`} style={{ position: "absolute", top, height: ROW, left: 0, right: 0 }}>
      <span className="rank">{word.rank}</span>
      <span>
        <b>{word.lemma}</b>
        <small>{word.gloss}</small>
      </span>
      {word.pos === "noun" ? <GenderTag gender={word.gender} article={word.article} /> : <small>{word.pos}</small>}
    </Link>
  );
}
