import { useMemo, useState } from "react";
import { useApp } from "../context.tsx";
import { checkAnswer } from "../lib/answer.ts";
import {
  conjugate,
  PERSON_LABELS,
  TENSE_LABELS,
  type Person,
  type Tense,
} from "../lib/conjugate.ts";

const TENSES: Tense[] = ["present", "preterite", "imperfect", "future", "conditional", "presentSubjunctive", "imperative"];
const PEOPLE: Person[] = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];

interface Prompt {
  lemma: string;
  gloss: string;
  tense: Tense;
  person: Person;
  answer: string;
}

export function Drill() {
  const { corpus, settings } = useApp();
  const [tenses, setTenses] = useState<Tense[]>(["present", "preterite", "presentSubjunctive"]);
  const [people, setPeople] = useState<Person[]>(["yo", "tu", "el", "nosotros", "ellos"]);
  const [irregularOnly, setIrregularOnly] = useState(true);
  const [typed, setTyped] = useState("");
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [note, setNote] = useState("");
  const [tally, setTally] = useState({ correct: 0, total: 0 });
  const verbs = useMemo(
    () => corpus.words.filter((word) => word.pos === "verb" && word.rank <= 2000),
    [corpus.words],
  );

  function next() {
    const usablePeople = people.filter((person) => settings.region === "spain" || person !== "vosotros");
    const usableTenses = tenses.length ? tenses : ["present" as Tense];
    const pool = verbs.filter((word) => {
      const paradigm = conjugate(word.lemma);
      if (!paradigm) return false;
      if (irregularOnly && paradigm.kind === "regular") return false;
      return true;
    });
    if (!pool.length || !usablePeople.length) {
      setPrompt(null);
      setNote("No verbs match these toggles.");
      return;
    }
    const word = pool[Math.floor(Math.random() * pool.length)];
    const paradigm = conjugate(word!.lemma);
    if (!paradigm || !word) return;
    const tense = usableTenses[Math.floor(Math.random() * usableTenses.length)] ?? "present";
    const person = usablePeople[Math.floor(Math.random() * usablePeople.length)] ?? "yo";
    const answer = tense === "imperative"
      ? paradigm.imperative[person === "yo" ? "tu" : person]
      : paradigm[tense][person];
    setPrompt({
      lemma: word.lemma,
      gloss: word.senses[0] || word.gloss,
      tense,
      person: tense === "imperative" && person === "yo" ? "tu" : person,
      answer,
    });
    setTyped("");
    setNote("");
  }

  function check() {
    if (!prompt) return;
    const result = checkAnswer(typed, [prompt.answer]);
    setTally((prev) => ({ correct: prev.correct + (result.result === "correct" ? 1 : 0), total: prev.total + 1 }));
    if (result.result === "correct") setNote("Correct.");
    else if (result.result === "accent") setNote(`Accent: ${result.suggestion}`);
    else setNote(`It’s ${prompt.answer}.`);
  }

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Conjugation</p>
        <h1>Drill the forms</h1>
        <p className="muted">{tally.total ? `${tally.correct}/${tally.total} exact this session` : "Pick tenses, then start."}</p>
      </header>
      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <div className="chips">
          {TENSES.map((tense) => (
            <button key={tense} className={`chip${tenses.includes(tense) ? " on" : ""}`} type="button" onClick={() => setTenses((curr) => curr.includes(tense) ? curr.filter((item) => item !== tense) : [...curr, tense])}>
              {TENSE_LABELS[tense]}
            </button>
          ))}
        </div>
        <div className="chips">
          {PEOPLE.filter((person) => settings.region === "spain" || person !== "vosotros").map((person) => (
            <button key={person} className={`chip${people.includes(person) ? " on" : ""}`} type="button" onClick={() => setPeople((curr) => curr.includes(person) ? curr.filter((item) => item !== person) : [...curr, person])}>
              {PERSON_LABELS[person]}
            </button>
          ))}
          <button className={`chip${irregularOnly ? " on" : ""}`} type="button" onClick={() => setIrregularOnly((value) => !value)}>Irregulars only</button>
        </div>
        <button className="btn primary" type="button" onClick={next}>{prompt ? "Next verb" : "Start"}</button>
      </section>
      {prompt && (
        <section className="card study-card">
          <p className="eyebrow">{TENSE_LABELS[prompt.tense]} · {PERSON_LABELS[prompt.person]}</p>
          <h2 className="lemma">{prompt.lemma}</h2>
          <p className="muted">{prompt.gloss}</p>
          <div className="accent-bar">
            {["á", "é", "í", "ó", "ú", "ñ"].map((char) => (
              <button key={char} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setTyped((value) => value + char)}>{char}</button>
            ))}
          </div>
          <input value={typed} autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="The form" onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") check(); }} />
          <div className="row">
            <button className="btn primary" type="button" onClick={check}>Check</button>
            <button className="btn" type="button" onClick={next}>Skip</button>
          </div>
          {note && <div className="verdict">{note}</div>}
        </section>
      )}
    </div>
  );
}
