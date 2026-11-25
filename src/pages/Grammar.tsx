import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AccentBar } from "../components/AccentBar.tsx";
import { GradeBar } from "../components/GradeBar.tsx";
import { useApp } from "../context.tsx";
import { GRAMMAR } from "../data/grammar.ts";
import { checkNormalized } from "../lib/answer.ts";
import { newCard, type Rating } from "../lib/srs.ts";

export function Grammar() {
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Grammar</p>
        <h1>Short lessons</h1>
        <p className="lede">Read the idea, then try a handful of questions.</p>
      </header>
      <div className="stack">
        {GRAMMAR.map((lesson) => (
          <Link key={lesson.id} className="pick" to={`/grammar/${lesson.id}`}>
            <span><b>{lesson.title}</b><small>{lesson.summary}</small></span>
            <span>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GrammarLesson() {
  const { id = "" } = useParams();
  const lesson = GRAMMAR.find((item) => item.id === id);
  const { cards, grade } = useApp();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  if (!lesson) return <section className="panel"><h1>That lesson isn’t here.</h1><Link to="/grammar">Lessons</Link></section>;
  const current = lesson;
  const question = current.questions[index];
  function check(value: string) {
    if (!question) return;
    const result = checkNormalized(value, question.answers);
    setPicked(value);
    setReady(true);
    setNote(result.result === "correct" ? "That’s it." : result.result === "accent" ? `Almost. ${result.suggestion}` : `Answer: ${question.answers[0]}. ${question.explain}`);
  }
  function next(rating: Rating) {
    if (!question) return;
    void grade(`gram:${current.id}:${index}`, rating, "grammar");
    setIndex((value) => Math.min(current.questions.length, value + 1));
    setTyped("");
    setPicked(null);
    setNote("");
    setReady(false);
  }
  return (
    <div className="page">
      <Link className="back" to="/grammar">Lessons</Link>
      <header>
        <p className="eyebrow">Grammar</p>
        <h1>{lesson.title}</h1>
        <p className="lede">{lesson.summary}</p>
      </header>
      {lesson.blocks.map((block) => (
        <section key={block.heading} className="panel stack">
          <h2>{block.heading}</h2>
          <p>{block.text}</p>
          {block.examples.map((example) => (
            <blockquote key={example.es} className="example">
              <p>{example.es}</p>
              <p className="en">{example.en}</p>
            </blockquote>
          ))}
        </section>
      ))}
      <section className="panel stack">
        <h2>Try it</h2>
        {!question ? <p>You finished this lesson’s questions.</p> : (
          <>
            <p className="muted">{index + 1} / {lesson.questions.length}</p>
            <h3>{question.prompt}</h3>
            {question.choices ? (
              <div className="choices">
                {question.choices.map((choice) => (
                  <button key={choice} className={`choice${picked === choice ? " on" : ""}`} type="button" disabled={ready} onClick={() => check(choice)}>{choice}</button>
                ))}
              </div>
            ) : (
              <>
                <AccentBar onInsert={(char) => setTyped((value) => value + char)} />
                <input value={typed} autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") check(typed); }} />
                {!ready && <button className="btn primary" type="button" onClick={() => check(typed)}>Check</button>}
              </>
            )}
            {note && <div className="verdict">{note}</div>}
            {ready && <GradeBar card={cards.get(`gram:${lesson.id}:${index}`) ?? newCard(`gram:${lesson.id}:${index}`)} onGrade={next} />}
          </>
        )}
      </section>
    </div>
  );
}
