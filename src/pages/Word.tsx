import { Link, useParams } from "react-router-dom";
import { ConjugationTables, WordForms } from "../components/Conjugation.tsx";
import { GenderTag } from "../components/GenderTag.tsx";
import { useApp } from "../context.tsx";
import { lessonForLemma } from "../data/grammar.ts";
import { conjugate } from "../lib/conjugate.ts";
import { isWord } from "../lib/corpus.ts";
import { GENDER_NOTES } from "../lib/morphology.ts";

export function WordPage() {
  const { id = "" } = useParams();
  const { corpus, cards, settings, toggleStar } = useApp();
  const found = corpus.byId.get(decodeURIComponent(id));
  if (!found || !isWord(found)) {
    return <section className="panel"><h1>That word isn’t in the deck.</h1><Link to="/words">Back to words</Link></section>;
  }
  const word = found;
  const starred = cards.get(word.id)?.starred ?? false;
  const paradigm = word.pos === "verb" ? conjugate(word.lemma) : null;
  const lesson = lessonForLemma(word.lemma);
  const note = GENDER_NOTES[word.lemma];
  return (
    <div className="page">
      <Link className="back" to="/words">Words</Link>
      <header className="card study-card">
        <div className="row">
          <GenderTag gender={word.gender} article={word.article} />
          <span className="chip">{word.pos}</span>
          <span className="muted">rank {word.rank}</span>
          {paradigm && paradigm.kind !== "regular" && <span className="muted">{paradigm.kind}</span>}
        </div>
        <h1 className="lemma">{word.lemma}</h1>
        <p className="gloss">{word.senses[0]?.split(";")[0]?.trim() || word.gloss}</p>
        {word.senses.length > 1 && (
          <details className="mood">
            <summary>More meanings</summary>
            <p className="muted">{word.senses.slice(1).join(" · ")}</p>
          </details>
        )}
        {word.note && <p className="muted">{word.note}</p>}
        {note && word.pos !== "verb" && <p className="muted">{note}</p>}
        {word.example && (
          <blockquote className="example">
            <p>{word.example.es}</p>
            <p className="en">{word.example.en}</p>
          </blockquote>
        )}
        <div className="row">
          <button className={`btn star${starred ? " on" : ""}`} type="button" onClick={() => void toggleStar(word.id)}>{starred ? "Starred" : "Star"}</button>
          <Link className="btn" to="/study">Study</Link>
        </div>
      </header>
      {word.pos !== "verb" && (
        <section className="panel stack">
          <h2>Forms</h2>
          <WordForms word={word} />
        </section>
      )}
      {paradigm && (
        <section className="panel stack">
          <h2>Conjugation</h2>
          <ConjugationTables lemma={word.lemma} region={settings.region} />
          <Link className="back" to="/grammar/commands">How commands work</Link>
          <Link className="back" to="/grammar/subjunctive">When to use the subjunctive</Link>
        </section>
      )}
      {lesson && <Link className="pick" to={`/grammar/${lesson.id}`}><span><b>{lesson.title}</b><small>{lesson.summary}</small></span><span>›</span></Link>}
    </div>
  );
}
