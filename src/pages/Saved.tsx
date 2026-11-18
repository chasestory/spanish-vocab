import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context.tsx";
import { isWord } from "../lib/corpus.ts";

export function Saved() {
  const { corpus, cards } = useApp();
  const [tab, setTab] = useState<"starred" | "difficult">("starred");
  const rows = [...cards.values()].filter((card) => (tab === "starred" ? card.starred : card.lapses >= 2));
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Keepers</p>
        <h1>Starred and difficult</h1>
      </header>
      <div className="chips">
        <button className={`chip${tab === "starred" ? " on" : ""}`} type="button" onClick={() => setTab("starred")}>Starred</button>
        <button className={`chip${tab === "difficult" ? " on" : ""}`} type="button" onClick={() => setTab("difficult")}>Difficult</button>
        <Link className="btn" to={`/study?pool=${tab}`}>Study these</Link>
      </div>
      {rows.length === 0 ? (
        <section className="panel">
          <h2>{tab === "starred" ? "No stars yet." : "Nothing has lapsed twice."}</h2>
          <p className="muted">{tab === "starred" ? "Open a word and star it." : "Miss a card twice and it lands here."}</p>
        </section>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          {rows.map((card) => {
            const item = corpus.byId.get(card.id);
            const title = item ? (isWord(item) ? item.lemma : item.es) : card.id;
            const gloss = item ? (isWord(item) ? item.gloss : item.en) : "";
            return (
              <Link key={card.id} className="hit" to={item && isWord(item) ? `/word/${encodeURIComponent(item.id)}` : "/phrases"}>
                <span className="rank">{card.lapses}</span>
                <span><b>{title}</b><small>{gloss}</small></span>
                <small>{card.interval}d</small>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
