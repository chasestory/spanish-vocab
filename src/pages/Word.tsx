import { Link, useParams } from "react-router-dom";
import { useApp } from "../context.tsx";
import { conjugate, PERSON_LABELS, TENSE_LABELS, type Person, type Tense } from "../lib/conjugate.ts";
import { speakSpanish } from "../lib/speech.ts";
import { isWord } from "../lib/corpus.ts";

const TENSES: Tense[] = ["present", "preterite", "imperfect", "future", "conditional", "presentSubjunctive"];
const PERSONS: Person[] = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

export function WordPage() {
  const { id = "" } = useParams();
  const { corpus, cards, settings, toggleStar } = useApp();
  const found = corpus.byId.get(decodeURIComponent(id));
  if (!found || !isWord(found)) {
    return <section className="panel"><h1>That word isn’t in the deck.</h1><Link to="/words">Back to the list</Link></section>;
  }
  const word = found;
  const starred = cards.get(word.id)?.starred ?? false;
  const paradigm = word.pos === "verb" ? conjugate(word.lemma) : null;
  const persons = settings.region === "spain" ? PERSONS : PERSONS.filter((person) => person !== "vosotros");
  return (
    <div className="page">
      <Link to="/words" className="muted">← Words</Link>
      <header className="card study-card">
        <div className="row">
          <span className="chip">{word.pos}</span>
          <span className="muted">rank {word.rank}</span>
          {word.gender && <span className="muted">{word.gender === "mf" ? "m/f" : word.gender}</span>}
          {paradigm && paradigm.kind !== "regular" && <span className="muted">{paradigm.kind}</span>}
        </div>
        <h1 className="lemma">
          {word.article && word.article !== "el/la" && <span className="article">{word.article}</span>}
          {word.lemma}
        </h1>
        <p className="gloss">{word.gloss}</p>
        {word.note && <p className="muted">{word.note}</p>}
        {word.example && (
          <blockquote className="example">
            <p>{word.example.es}</p>
            <p className="en">{word.example.en}</p>
          </blockquote>
        )}
        <div className="row">
          <button className="btn" type="button" onClick={() => speakSpanish(word.article && word.article !== "el/la" ? `${word.article} ${word.lemma}` : word.lemma, settings)}>Hear it</button>
          <button className={`btn star${starred ? " on" : ""}`} type="button" onClick={() => void toggleStar(word.id)}>{starred ? "Starred" : "Star"}</button>
          <Link className="btn" to="/study">Study</Link>
        </div>
      </header>
      {paradigm && (
        <section className="panel" style={{ display: "grid", gap: 12 }}>
          <h2>Conjugation</h2>
          <p className="muted">Gerund {paradigm.gerund} · participle {paradigm.participle}{paradigm.reflexive ? " · reflexive" : ""}</p>
          {paradigm.note && <p className="muted">{paradigm.note}</p>}
          <div className="table-wrap">
            <table className="conj">
              <thead>
                <tr>
                  <th> </th>
                  {TENSES.map((tense) => <th key={tense}>{TENSE_LABELS[tense]}</th>)}
                </tr>
              </thead>
              <tbody>
                {persons.map((person) => (
                  <tr key={person}>
                    <th>{PERSON_LABELS[person]}</th>
                    {TENSES.map((tense) => {
                      const forms = paradigm[tense] as Record<Person, string>;
                      return <td key={tense}>{forms[person]}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Imperative</h3>
          <div className="table-wrap">
            <table className="conj">
              <thead>
                <tr><th> </th><th>Affirmative</th><th>Negative</th></tr>
              </thead>
              <tbody>
                {(["tu", "el", "nosotros", "vosotros", "ellos"] as const)
                  .filter((person) => settings.region === "spain" || person !== "vosotros")
                  .map((person) => (
                    <tr key={person}>
                      <th>{PERSON_LABELS[person]}</th>
                      <td>{paradigm.imperative[person]}</td>
                      <td>{paradigm.imperativeNegative[person]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
