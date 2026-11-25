import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { isWord } from "../lib/corpus.ts";

export function Saved() {
  const { corpus, cards } = useApp();
  const [tab, setTab] = useState<"starred" | "difficult">("starred");
  const rows = [...cards.values()].filter((card) => (tab === "starred" ? card.starred : card.lapses >= 2));
  return (
    <div className="page">
      <header>
        <p className="eyebrow">My words</p>
        <h1>{tab === "starred" ? "Starred" : "Struggling"}</h1>
        <p className="lede">{tab === "difficult" ? "Anything you miss twice lands here on its own." : "Star a word, a phrase, or a theme card and it stays in this list."}</p>
      </header>
      <div className="chips">
        <button className={`chip${tab === "starred" ? " on" : ""}`} type="button" onClick={() => setTab("starred")}>Starred</button>
        <button className={`chip${tab === "difficult" ? " on" : ""}`} type="button" onClick={() => setTab("difficult")}>Struggling</button>
        <Link className="btn" to={`/study?pool=${tab}`}>Study these</Link>
      </div>
      {rows.length === 0 ? (
        <section className="panel">
          <h2>{tab === "starred" ? "Nothing starred yet." : "Nothing is struggling."}</h2>
          <p className="muted">{tab === "starred" ? "Open a word and tap Star." : "Two misses on the same card will put it here."}</p>
        </section>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          {rows.map((card) => {
            const item = corpus.byId.get(card.id);
            const title = item ? (isWord(item) ? item.lemma : item.es) : card.id.replace(/^(prep|pron|theme|gram|conj|gender):/, "");
            const gloss = item ? (isWord(item) ? item.gloss : item.en) : "";
            const to = item && isWord(item) ? `/word/${encodeURIComponent(item.id)}` : "/explore";
            return (
              <Link key={card.id} className="hit" to={to}>
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
