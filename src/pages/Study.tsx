import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AccentBar } from "../components/AccentBar.tsx";
import { ConjugationTables, WordForms } from "../components/Conjugation.tsx";
import { GenderTag } from "../components/GenderTag.tsx";
import { GradeBar } from "../components/GradeBar.tsx";
import { useApp } from "../context.tsx";
import { checkAnswer, checkNormalized, type AnswerResult } from "../lib/answer.ts";
import { conjugate, PERSON_LABELS, TENSE_LABELS } from "../lib/conjugate.ts";
import { choiceOptions } from "../lib/deck.ts";
import { newCard, type Rating } from "../lib/srs.ts";
import {
  buildSession,
  buildSteps,
  choicePool,
  englishOf,
  expectedOf,
  selectionSummary,
  spanishOf,
  type Presentation,
  type Step,
  type StudyCard,
} from "../lib/session.ts";
import { THEME_GROUPS, THEMES } from "../data/themes.ts";
import { CATEGORIES, POS_LABEL, type Filters, type Pos, type StudyMode, type StudySet } from "../lib/types.ts";

const MODES: { id: StudyMode; label: string }[] = [
  { id: "mix", label: "Mix" },
  { id: "reveal", label: "Flip" },
  { id: "type", label: "Type" },
  { id: "choice", label: "Choice" },
  { id: "match", label: "Match" },
];

function instruction(step: Step): string {
  const card = step.cards[0];
  if (!card) return "";
  if (step.presentation === "match") return "Tap a Spanish phrase, then its English match.";
  if (card.kind === "gender") return "Is this noun masculine or feminine?";
  if (card.kind === "prep") return step.presentation === "type" ? "Type the preposition." : "Which preposition does this verb take?";
  if (card.kind === "pronoun") return step.presentation === "choice" ? "Pick the right answer." : "Type the rewritten sentence.";
  if (card.kind === "conj") return `Type the form for ${PERSON_LABELS[card.person]}.`;
  if (card.kind === "grammar") return step.presentation === "choice" ? "Pick the form that fits." : "Type the missing word.";
  if (step.presentation === "type") return "Type the Spanish.";
  if (step.presentation === "choice") return "Pick the meaning.";
  return "Look at the Spanish, then check yourself.";
}

export function Study() {
  const app = useApp();
  const [params] = useSearchParams();
  const autostart = params.get("start") === "1";
  const pool = params.get("pool");
  const [phase, setPhase] = useState<"setup" | "run" | "done">(autostart || pool ? "run" : "setup");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<{ result: AnswerResult; suggestion?: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [armed, setArmed] = useState<{ side: "es" | "en"; value: string } | null>(null);
  const [misses, setMisses] = useState(0);
  const score = useRef({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const active: Filters = pool === "starred" || pool === "difficult" ? { ...app.filters, pool } : app.filters;

  function begin(next = active) {
    const queue = buildSession(
      app.corpus.words,
      app.corpus.phrases,
      app.cards,
      next,
      Math.max(0, app.settings.newPerDay - app.meta.newToday),
      Date.now(),
      app.settings.region,
    );
    score.current = { correct: 0, total: 0 };
    setSteps(buildSteps(queue, next.mode));
    setIndex(0);
    reset();
    setPhase(queue.length ? "run" : "done");
  }

  function reset() {
    setShow(false);
    setTyped("");
    setVerdict(null);
    setPicked(null);
    setMatched([]);
    setArmed(null);
    setMisses(0);
  }

  useEffect(() => {
    if ((autostart || pool) && !steps) begin(active);
    // The saved selection is the session. Rebuild only when Start is tapped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps?.[index];
  const card = step?.cards[0];

  function finish(rating: Rating) {
    if (!step) return;
    for (const item of step.cards) {
      const mode = item.kind === "conj" ? `conj:${item.tense}` : step.presentation;
      void app.grade(item.id, rating, mode);
    }
    score.current.total += step.cards.length;
    if (rating !== "again") score.current.correct += step.cards.length;
    if (!steps || index + 1 >= steps.length) {
      setPhase("done");
      return;
    }
    setIndex(index + 1);
    reset();
  }

  function judge(value: string) {
    if (!card || !step) return;
    const expected = expectedOf(card, step.presentation);
    const strict = card.kind === "pronoun" || card.kind === "conj" || card.kind === "prep" || card.kind === "grammar" || card.kind === "gender";
    const result = strict ? checkNormalized(value, expected) : checkAnswer(value, expected);
    setVerdict(result);
    setShow(true);
  }

  function insert(char: string) {
    const el = inputRef.current;
    if (!el) {
      setTyped((value) => value + char);
      return;
    }
    const start = el.selectionStart ?? typed.length;
    const end = el.selectionEnd ?? start;
    setTyped(typed.slice(0, start) + char + typed.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + char.length;
      el.setSelectionRange(caret, caret);
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!step || phase !== "run") return;
      const typing = (event.target as HTMLElement | null)?.tagName === "INPUT";
      if (show) {
        const map: Record<string, Rating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        const rating = map[event.key];
        if (rating) finish(rating);
        return;
      }
      if (step.presentation === "reveal" && event.key === " " && !typing) {
        event.preventDefault();
        setShow(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "setup") {
    return <Setup filters={app.filters} onChange={app.setFilters} onStart={(next) => begin(next ?? app.filters)} />;
  }
  if (phase === "run" && !steps) {
    return <div className="page"><h1>Getting your cards…</h1></div>;
  }
  if (phase === "done" || !step || !card) {
    const empty = !steps?.length;
    return (
      <div className="page">
        <header>
          <p className="eyebrow">Session</p>
          <h1>{empty ? "Nothing matched" : "That’s the session"}</h1>
        </header>
        <section className="panel stack">
          {empty ? (
            <p>Widen the frequency range or turn on another word type. Your last selection is saved.</p>
          ) : (
            <h2>{score.current.correct} of {score.current.total} felt solid</h2>
          )}
          <p className="muted">Again counts as a miss. Hard, Good, and Easy count as remembered.</p>
          <div className="row">
            <button className="btn primary" type="button" onClick={() => begin(active)}>Study again</button>
            <button className="btn" type="button" onClick={() => { setSteps(null); setPhase("setup"); }}>Change selection</button>
            <Link className="btn" to="/">Today</Link>
          </div>
        </section>
      </div>
    );
  }

  const options = step.presentation === "choice"
    ? card.kind === "gender"
      ? ["el", "la", "either"]
      : card.kind === "pronoun" && card.exercise.choices
        ? card.exercise.choices
        : card.kind === "grammar" && card.question.choices
          ? card.question.choices
          : card.kind === "prep"
            ? ["a", "de", "en", "con", "por", "para"]
            : choiceOptions(englishOf(card), choicePool(card, app.corpus.words, app.corpus.phrases))
    : [];

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Study</p>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "1.6rem" }}>{index + 1} of {steps?.length}</h1>
          <button className="btn ghost" type="button" onClick={() => setPhase("done")}>End</button>
        </div>
      </header>
      <div className="progress" aria-hidden="true"><i style={{ width: `${((index + 1) / (steps?.length || 1)) * 100}%` }} /></div>
      <p className="lede" style={{ margin: 0 }}>{instruction(step)}</p>
      {step.presentation === "match" ? (
        <MatchBoard
          cards={step.cards}
          matched={matched}
          armed={armed}
          onArm={setArmed}
          onMiss={() => setMisses((value) => value + 1)}
          onLock={(value) => setMatched((current) => [...current, value])}
          done={matched.length >= step.cards.length}
        />
      ) : (
        <article className="card study-card">
          <CardFace card={card} presentation={step.presentation} show={show} />
          {step.presentation === "choice" && (
            <div className="choices">
              {options.map((option) => {
                const correct = expectedOf(card, "choice").some((answer) => answer.toLowerCase() === option.toLowerCase())
                  || option.toLowerCase() === englishOf(card).toLowerCase()
                  || (card.kind === "gender" && option === "either" && (card.word.gender === "mf" || card.word.article === "el/la"));
                const right = show && correct;
                const wrong = show && option === picked && !correct;
                return (
                  <button
                    key={option}
                    className={`choice${right ? " right" : ""}${wrong ? " wrong" : ""}`}
                    type="button"
                    disabled={show}
                    onClick={() => { setPicked(option); judge(option); }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
          {step.presentation === "reveal" && !show && (
            <button className="btn primary wide" type="button" onClick={() => setShow(true)}>Show the answer</button>
          )}
          {show && verdict && (
            <div className={`verdict ${verdict.result}`}>
              {verdict.result === "correct" && "That’s it."}
              {verdict.result === "accent" && `Almost. The spelling is ${verdict.suggestion}.`}
              {verdict.result === "wrong" && `Answer: ${verdict.suggestion ?? expectedOf(card, step.presentation)[0]}`}
            </div>
          )}
          {show && (card.kind === "pronoun" || card.kind === "grammar" || card.kind === "prep") && (
            <p className="muted">{card.kind === "prep" ? card.entry.contrast || card.entry.example : card.kind === "pronoun" ? card.exercise.explain : card.question.explain}</p>
          )}
          {show && step.presentation === "reveal" && <p className="gloss">{englishOf(card)}</p>}
          {show && (card.kind === "word" || card.kind === "theme") && (
            <details className="mood">
              <summary>See more</summary>
              <BackMatter card={card} region={app.settings.region} />
            </details>
          )}
        </article>
      )}
      {step.presentation === "type" && !show && (
        <div className="type-bar">
          <AccentBar onInsert={insert} />
          <input
            ref={inputRef}
            value={typed}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type the answer"
            enterKeyHint="done"
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") judge(typed); }}
          />
          <button className="btn primary wide" type="button" onClick={() => judge(typed)}>Check answer</button>
        </div>
      )}
      {step.presentation === "match" && misses > 0 && matched.length >= step.cards.length && (
        <p className="muted">{misses} mismatch{misses === 1 ? "" : "es"}. Rate the round honestly.</p>
      )}
      {(show || (step.presentation === "match" && matched.length >= step.cards.length)) && (
        <div className="dock">
          <GradeBar card={app.cards.get(card.id) ?? newCard(card.id)} onGrade={finish} />
        </div>
      )}
      <p className="kbd">Space shows a flip card · 1 Again, 2 Hard, 3 Good, 4 Easy</p>
    </div>
  );
}

function CardFace({ card, presentation, show }: { card: StudyCard; presentation: Presentation; show: boolean }) {
  if (card.kind === "conj") {
    return (
      <>
        <span className="chip">{TENSE_LABELS[card.tense]}</span>
        <h2 className="lemma">{card.lemma}</h2>
        <p className="muted">{PERSON_LABELS[card.person]} · {card.gloss}</p>
        {show && <p className="gloss">{card.answer}</p>}
      </>
    );
  }
  if (card.kind === "prep") {
    const blank = card.entry.example.replace(new RegExp(`\\b${card.entry.prep}\\b`, "i"), "___");
    return (
      <>
        <span className="chip">{card.entry.verb}</span>
        <h2 className="gloss">{presentation === "reveal" ? card.entry.verb : blank}</h2>
        <p className="muted">{card.entry.gloss}</p>
        {show && <p className="gloss">{card.entry.prep} · {card.entry.example}</p>}
      </>
    );
  }
  if (card.kind === "pronoun" || card.kind === "grammar") {
    const prompt = card.kind === "pronoun" ? card.exercise.prompt : card.question.prompt;
    return (
      <>
        <span className="chip">{card.kind === "pronoun" ? "Pronouns" : card.lessonTitle}</span>
        <h2 className="gloss">{prompt}</h2>
      </>
    );
  }
  if (card.kind === "gender") {
    return (
      <>
        <GenderTag gender={card.word.gender} article={card.word.article} />
        <h2 className="lemma">{card.word.lemma}</h2>
        <p className="muted">{card.word.gloss}</p>
        {show && <p className="gloss">{card.word.article}</p>}
      </>
    );
  }
  const frontSpanish = presentation !== "type";
  return (
    <>
      <div className="row">
        {card.kind === "word" && <GenderTag gender={card.word.gender} article={card.word.article} />}
        {card.kind === "theme" && card.item.gender && <GenderTag gender={card.item.gender} article={card.item.article} />}
        <span className="chip">{card.kind === "word" ? card.word.pos : card.kind === "theme" ? card.themeTitle : "Phrase"}</span>
      </div>
      <h2 className={frontSpanish ? "lemma" : "gloss"}>{frontSpanish ? spanishOf(card) : englishOf(card)}</h2>
      {show && presentation === "type" && <p className="gloss">{spanishOf(card)}</p>}
    </>
  );
}

function BackMatter({ card, region }: { card: StudyCard; region: "latam" | "spain" }) {
  if (card.kind === "word" && card.word.pos === "verb" && conjugate(card.word.lemma)) {
    return <ConjugationTables lemma={card.word.lemma} region={region} />;
  }
  if (card.kind === "word") return <WordForms word={card.word} />;
  if (card.kind === "theme") {
    return (
      <blockquote className="example">
        <p>{card.item.example}</p>
        <p className="en">{card.item.exampleEn}</p>
      </blockquote>
    );
  }
  return null;
}

function MatchBoard(props: {
  cards: StudyCard[];
  matched: string[];
  armed: { side: "es" | "en"; value: string } | null;
  onArm: (next: { side: "es" | "en"; value: string } | null) => void;
  onLock: (value: string) => void;
  onMiss: () => void;
  done: boolean;
}) {
  const pairs = props.cards.map((card) => ({ id: card.id, es: spanishOf(card), en: englishOf(card) }));
  const english = useMemo(() => choiceOptions(pairs[0]?.en ?? "", pairs.map((pair) => pair.en)), [props.cards]);
  function tap(side: "es" | "en", value: string, id: string) {
    if (props.matched.includes(id) || props.done) return;
    if (!props.armed) {
      props.onArm({ side, value });
      return;
    }
    if (props.armed.side === side) {
      props.onArm({ side, value });
      return;
    }
    const es = side === "es" ? value : props.armed.value;
    const en = side === "en" ? value : props.armed.value;
    const hit = pairs.find((pair) => pair.es === es && pair.en === en);
    if (hit) props.onLock(hit.id);
    else props.onMiss();
    props.onArm(null);
  }
  return (
    <div className="match-grid">
      <div className="stack">
        {pairs.map((pair) => (
          <button key={pair.id} className={`choice${props.matched.includes(pair.id) ? " locked" : ""}${props.armed?.side === "es" && props.armed.value === pair.es ? " on" : ""}`} type="button" onClick={() => tap("es", pair.es, pair.id)}>
            {pair.es}
          </button>
        ))}
      </div>
      <div className="stack">
        {english.map((label) => {
          const pair = pairs.find((item) => item.en === label);
          const id = pair?.id ?? label;
          return (
            <button key={label} className={`choice${pair && props.matched.includes(pair.id) ? " locked" : ""}${props.armed?.side === "en" && props.armed.value === label ? " on" : ""}`} type="button" onClick={() => tap("en", label, id)}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PRESETS: { id: string; title: string; detail: string; patch: Partial<Filters> }[] = [
  { id: "quick", title: "Quick mix", detail: "Common words, mixed cards", patch: { sets: ["words"], band: 500, mode: "mix", irregularOnly: false, poses: [], gender: "all", pool: "deck", source: "words" } },
  { id: "verbs", title: "Verbs", detail: "Type a conjugated form", patch: { sets: ["verbs"], band: 1000, mode: "type", irregularOnly: true, poses: ["verb"], pool: "deck" } },
  { id: "themes", title: "Themes", detail: "Rooms, food, travel, and more", patch: { sets: ["themes"], themes: [], mode: "mix", pool: "deck" } },
  { id: "grammar", title: "Grammar", detail: "A short lesson, then a few questions", patch: { sets: ["grammar"], mode: "choice", pool: "deck" } },
];

function Setup({ filters, onChange, onStart }: { filters: Filters; onChange: (next: Filters) => void; onStart: (next?: Filters) => void }) {
  const poses = Object.entries(POS_LABEL) as [Pos, string][];
  const [preset, setPreset] = useState("quick");
  function choose(id: string, patch: Partial<Filters>) {
    setPreset(id);
    onChange({ ...filters, ...patch });
  }
  function toggleSet(id: StudySet) {
    const sets = filters.sets.includes(id) ? filters.sets.filter((item) => item !== id) : [...filters.sets, id];
    const source = sets.includes("words") && sets.includes("phrases") ? "both" : sets.includes("phrases") && !sets.includes("words") ? "phrases" : "words";
    setPreset("custom");
    onChange({ ...filters, sets, source });
  }
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Study</p>
        <h1>What today?</h1>
        <p className="lede">Pick one. You can fine-tune it under Advanced.</p>
      </header>
      <section className="stack">
        {PRESETS.map((item) => (
          <button key={item.id} className={`pick${preset === item.id ? " on" : ""}`} type="button" onClick={() => choose(item.id, item.patch)}>
            <span><b>{item.title}</b><small>{item.detail}</small></span>
          </button>
        ))}
        <button className={`pick${preset === "mine" ? " on" : ""}`} type="button" onClick={() => { setPreset("mine"); }}>
          <span><b>My words</b><small>Only the ones you starred</small></span>
        </button>
      </section>
      <button className="btn primary huge" type="button" onClick={() => onStart(preset === "mine" ? { ...filters, pool: "starred" } : filters)}>Start</button>
      <details className="mood panel">
        <summary>Advanced</summary>
        <div className="stack" style={{ marginTop: 8 }}>
        <section className="stack">
          <h2>Words</h2>
          <div className="chips">
            {([100, 500, 1000, 2000, 3000, 5000] as const).map((band) => (
              <button key={band} className={`chip${filters.band === band ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, band })}>Top {band}</button>
            ))}
            <button className={`chip${filters.band === "custom" ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, band: "custom" })}>Range</button>
          </div>
          {filters.band === "custom" && (
            <div className="row">
              <label className="field">From rank<input type="number" min={1} max={5000} value={filters.rankMin} onChange={(event) => onChange({ ...filters, rankMin: Number(event.target.value) })} /></label>
              <label className="field">To rank<input type="number" min={1} max={5000} value={filters.rankMax} onChange={(event) => onChange({ ...filters, rankMax: Number(event.target.value) })} /></label>
            </div>
          )}
          <p className="muted">Word types. Leave these off to include every type.</p>
          <div className="chips">
            {poses.map(([pos, label]) => {
              const on = filters.poses.includes(pos);
              return (
                <button key={pos} className={`chip${on ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, poses: on ? filters.poses.filter((item) => item !== pos) : [...filters.poses, pos] })}>
                  {label}
                </button>
              );
            })}
          </div>
          <div className="chips">
            <button className={`chip${filters.irregularOnly ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, irregularOnly: !filters.irregularOnly })}>Irregular verbs only</button>
            {(["all", "m", "f"] as const).map((gender) => (
              <button key={gender} className={`chip${filters.gender === gender ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, gender })}>
                {gender === "all" ? "Any gender" : gender === "m" ? "Masculine nouns" : "Feminine nouns"}
              </button>
            ))}
          </div>
          <p className="muted">Also include</p>
          <div className="chips">
            {(["words", "phrases", "verbs", "prepositions", "pronouns", "gender", "themes", "grammar"] as StudySet[]).map((id) => (
              <button key={id} className={`chip${filters.sets.includes(id) ? " on" : ""}`} type="button" onClick={() => toggleSet(id)}>
                {id === "gender" ? "el / la" : id}
              </button>
            ))}
          </div>
        </section>
      {filters.sets.includes("phrases") && (
        <section className="panel stack">
          <h2>Phrases</h2>
          <div className="chips">
            {CATEGORIES.map((category) => (
              <button key={category.id} className={`chip${filters.category === category.id ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, category: category.id })}>{category.label}</button>
            ))}
          </div>
        </section>
      )}
      {filters.sets.includes("themes") && (
        <section className="panel stack">
          <h2>Themes</h2>
          <p className="muted">Leave them all off to include every theme.</p>
          {THEME_GROUPS.map((group) => (
            <div key={group} className="stack">
              <h3>{group}</h3>
              <div className="chips">
                {THEMES.filter((theme) => theme.group === group).map((theme) => {
                  const on = filters.themes.includes(theme.id);
                  return (
                    <button key={theme.id} className={`chip${on ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, themes: on ? filters.themes.filter((id) => id !== theme.id) : [...filters.themes, theme.id] })}>
                      {theme.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
        <h2>Card style</h2>
        <div className="chips">
          {MODES.map((mode) => (
            <button key={mode.id} className={`chip${filters.mode === mode.id ? " on" : ""}`} type="button" onClick={() => { setPreset("custom"); onChange({ ...filters, mode: mode.id }); }}>{mode.label}</button>
          ))}
        </div>
        <p className="muted">{selectionSummary(filters)}</p>
        </div>
      </details>
    </div>
  );
}
