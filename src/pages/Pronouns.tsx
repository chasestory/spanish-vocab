import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.tsx";
import { PRONOUN_EXERCISES, PRONOUN_GUIDE } from "../data/pronouns.ts";

export function Pronouns() {
  const { setFilters, filters } = useApp();
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const items = PRONOUN_EXERCISES.filter((item) => level === 0 || item.level === level);
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Pronouns</p>
        <h1>Direct and indirect</h1>
        <p className="lede">Replace the nouns, put the pronouns in order, and accept both legal positions.</p>
      </header>
      <Link className="btn primary" to="/study?start=1" onClick={() => setFilters({ ...filters, sets: ["pronouns"] })}>
        Practice pronouns
      </Link>
      {PRONOUN_GUIDE.map((block) => (
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
      <div className="chips">
        {([0, 1, 2, 3] as const).map((value) => (
          <button key={value} className={`chip${level === value ? " on" : ""}`} type="button" onClick={() => setLevel(value)}>
            {value === 0 ? "All" : `Level ${value}`}
          </button>
        ))}
      </div>
      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel">
            <span className="chip">Level {item.level} · {item.kind}</span>
            <p>{item.prompt}</p>
            <p className="muted">{item.answers.join("  ·  ")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
