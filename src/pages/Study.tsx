import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context.tsx";
import { checkAnswer, type AnswerResult } from "../lib/answer.ts";
import { isIrregularVerb } from "../lib/conjugate.ts";
import { buildQueue, choiceOptions, type StudyItem } from "../lib/deck.ts";
import { newCard, reviewCard, type Rating } from "../lib/srs.ts";
import { speakSpanish } from "../lib/speech.ts";
import type { Filters, Pool, Pos, StudyMode, Word } from "../lib/types.ts";
import { CATEGORIES, POS_LABEL } from "../lib/types.ts";

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];
const MODES: { id: StudyMode; label: string }[] = [
  { id: "reveal", label: "Flip" },
  { id: "type", label: "Type" },
  { id: "choice", label: "Choice" },
  { id: "listen", label: "Listen" },
];

function promptEs(item: StudyItem): string {
  if (item.kind === "phrase") return item.phrase.es;
  const word = item.word;
  if (word.article && word.article !== "el/la") return `${word.article} ${word.lemma}`;
  return word.lemma;
}

function promptEn(item: StudyItem): string {
  return item.kind === "phrase" ? item.phrase.en : item.word.gloss;
}

function expectedAnswers(item: StudyItem): string[] {
  if (item.kind === "phrase") return [item.phrase.es];
  const word = item.word;
  const answers = [word.lemma, ...word.senses];
  if (word.article && word.article !== "el/la") answers.push(`${word.article} ${word.lemma}`);
  return answers;
}

export function Study() {
  const { corpus, cards, settings, filters, setFilters, meta, grade } = useApp();
  const [params] = useSearchParams();
  const poolParam = params.get("pool");
  const pool: Pool = poolParam === "starred" || poolParam === "difficult" ? poolParam : filters.pool;
  const active: Filters = { ...filters, pool };
  const [queue, setQueue] = useState<StudyItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<"ask" | "retry" | "grade">("ask");
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<{ result: AnswerResult; suggestion?: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [summary, setSummary] = useState<{ correct: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const againCount = useRef(new Map<string, number>());
  const score = useRef({ correct: 0, total: 0 });

  const current = queue?.[index];
  const choices = useMemo(() => {
    if (!current || (active.mode !== "choice" && active.mode !== "listen")) return [];
    const correct = current.kind === "phrase" ? current.phrase.en : current.word.senses[0] || current.word.gloss;
    const poolItems = current.kind === "phrase"
      ? corpus.phrases.map((phrase) => phrase.en)
      : corpus.words.filter((word) => word.pos === current.word.pos).map((word) => word.senses[0] || word.gloss);
    return choiceOptions(correct, poolItems);
  }, [current, active.mode, corpus.phrases, corpus.words]);

  useEffect(() => {
    if (!current || active.mode !== "listen" || stage !== "ask") return;
    speakSpanish(promptEs(current), settings);
  }, [current, active.mode, stage, settings]);

  function start(next = active) {
    const built = buildQueue(
      corpus.words,
      corpus.phrases,
      cards,
      next,
      Math.max(0, settings.newPerDay - meta.newToday),
      Date.now(),
    );
    againCount.current = new Map();
    score.current = { correct: 0, total: 0 };
    setSummary(null);
    setQueue(built);
    setIndex(0);
    resetCard();
  }

  function resetCard() {
    setStage("ask");
    setTyped("");
    setVerdict(null);
    setPicked(null);
  }

  function finishGrade(rating: Rating) {
    if (!current || !queue) return;
    void grade(current.id, rating, active.mode);
    score.current.total += 1;
    if (rating !== "again") score.current.correct += 1;
    const nextQueue = [...queue];
    let nextIndex = index + 1;
    if (rating === "again") {
      const seen = (againCount.current.get(current.id) ?? 0) + 1;
      againCount.current.set(current.id, seen);
      if (seen < 3) {
        const insertAt = Math.min(nextQueue.length, index + 4);
        nextQueue.splice(insertAt, 0, current);
        setQueue(nextQueue);
      }
    }
    if (nextIndex >= nextQueue.length) {
      setSummary({ ...score.current });
      return;
    }
    setIndex(nextIndex);
    resetCard();
  }

  function submitTyped() {
    if (!current) return;
    const result = checkAnswer(typed, expectedAnswers(current));
    if (result.result === "accent" && stage === "ask") {
      setVerdict(result);
      setStage("retry");
      return;
    }
    setVerdict(result.result === "accent" ? { result: "wrong", suggestion: result.suggestion } : result);
    setStage("grade");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = (event.target as HTMLElement | null)?.tagName === "INPUT";
      if (event.key === "?" && !typing) {
        setHelp(true);
        return;
      }
      if (!current || summary) return;
      if (stage === "grade") {
        const map: Record<string, Rating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        const rating = map[event.key];
        if (rating) finishGrade(rating);
        return;
      }
      if (active.mode === "reveal" && event.key === " " && !typing) {
        event.preventDefault();
        setStage("grade");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function insertAccent(char: string) {
    const el = inputRef.current;
    if (!el) {
      setTyped((value) => value + char);
      return;
    }
    const start = el.selectionStart ?? typed.length;
    const end = el.selectionEnd ?? start;
    const next = typed.slice(0, start) + char + typed.slice(end);
    setTyped(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + char.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Study</p>
        <h1>{pool === "starred" ? "Starred" : pool === "difficult" ? "Difficult" : "Today’s queue"}</h1>
      </header>
      <DeckControls filters={active} onChange={(next) => { setFilters({ ...next, pool: filters.pool }); }} />
      {queue === null ? (
        <button className="btn primary wide" type="button" onClick={() => start()}>Start session</button>
      ) : summary ? (
        <section className="panel">
          <h2>{summary.correct} of {summary.total} felt solid</h2>
          <p className="muted">Again counts as a miss. Hard, Good, and Easy count as remembered.</p>
          <div className="row">
            <button className="btn primary" type="button" onClick={() => start()}>Another round</button>
            <button className="btn" type="button" onClick={() => setQueue(null)}>Change deck</button>
          </div>
        </section>
      ) : !current ? (
        <section className="panel">
          <h2>Nothing is due in this deck.</h2>
          <p className="muted">Widen the frequency band, switch to phrases, or come back when reviews are due.</p>
        </section>
      ) : (
        <Session
          item={current}
          index={index}
          total={queue.length}
          mode={active.mode}
          stage={stage}
          typed={typed}
          setTyped={setTyped}
          verdict={verdict}
          picked={picked}
          choices={choices}
          inputRef={inputRef}
          card={cards.get(current.id) ?? newCard(current.id)}
          onReveal={() => setStage("grade")}
          onSubmit={submitTyped}
          onPick={(option) => {
            setPicked(option);
            const correct = current.kind === "phrase" ? current.phrase.en : current.word.senses[0] || current.word.gloss;
            setVerdict({ result: option === correct ? "correct" : "wrong", suggestion: correct });
            setStage("grade");
          }}
          onGrade={finishGrade}
          onSpeak={() => speakSpanish(promptEs(current), settings)}
          onAccent={insertAccent}
          onHelp={() => setHelp(true)}
        />
      )}
      {help && (
        <dialog open>
          <h2>Keys</h2>
          <p>Space shows the answer. 1 Again, 2 Hard, 3 Good, 4 Easy. Enter checks a typed answer.</p>
          <button className="btn" type="button" onClick={() => setHelp(false)}>Close</button>
        </dialog>
      )}
    </div>
  );
}

function DeckControls({ filters, onChange }: { filters: Filters; onChange: (next: Filters) => void }) {
  const poses = Object.entries(POS_LABEL) as [Pos, string][];
  return (
    <section className="panel" style={{ display: "grid", gap: 12 }}>
      <div className="chips">
        {MODES.map((mode) => (
          <button key={mode.id} className={`chip${filters.mode === mode.id ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, mode: mode.id })}>
            {mode.label}
          </button>
        ))}
      </div>
      <div className="chips">
        {([100, 500, 1000, 2000, 3000, 5000] as const).map((band) => (
          <button key={band} className={`chip${filters.band === band ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, band })}>
            Top {band}
          </button>
        ))}
        <button className={`chip${filters.band === "custom" ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, band: "custom" })}>
          Range
        </button>
      </div>
      {filters.band === "custom" && (
        <div className="row">
          <label className="field">From rank<input type="number" min={1} max={5000} value={filters.rankMin} onChange={(event) => onChange({ ...filters, rankMin: Number(event.target.value) })} /></label>
          <label className="field">To rank<input type="number" min={1} max={5000} value={filters.rankMax} onChange={(event) => onChange({ ...filters, rankMax: Number(event.target.value) })} /></label>
        </div>
      )}
      <div className="chips">
        <button className={`chip${filters.source === "words" ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, source: "words" })}>Words</button>
        <button className={`chip${filters.source === "phrases" ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, source: "phrases" })}>Phrases</button>
        <button className={`chip${filters.source === "both" ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, source: "both" })}>Both</button>
        <button className={`chip${filters.irregularOnly ? " on" : ""}`} type="button" onClick={() => onChange({ ...filters, irregularOnly: !filters.irregularOnly })}>
          Irregular verbs
        </button>
      </div>
      {filters.source !== "phrases" && (
        <div className="chips">
          {poses.map(([pos, label]) => {
            const on = filters.poses.includes(pos);
            return (
              <button
                key={pos}
                className={`chip${on ? " on" : ""}`}
                type="button"
                onClick={() => onChange({ ...filters, poses: on ? filters.poses.filter((item) => item !== pos) : [...filters.poses, pos] })}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {filters.source !== "words" && (
        <label className="field">
          Phrase category
          <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
            {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}

function Session(props: {
  item: StudyItem;
  index: number;
  total: number;
  mode: StudyMode;
  stage: "ask" | "retry" | "grade";
  typed: string;
  setTyped: (value: string) => void;
  verdict: { result: AnswerResult; suggestion?: string } | null;
  picked: string | null;
  choices: string[];
  inputRef: RefObject<HTMLInputElement | null>;
  card: ReturnType<typeof newCard>;
  onReveal: () => void;
  onSubmit: () => void;
  onPick: (option: string) => void;
  onGrade: (rating: Rating) => void;
  onSpeak: () => void;
  onAccent: (char: string) => void;
  onHelp: () => void;
}) {
  const spanishFirst = props.mode === "reveal" || props.mode === "choice" || props.mode === "listen";
  const correctChoice = props.item.kind === "phrase" ? props.item.phrase.en : props.item.word.senses[0] || props.item.word.gloss;
  const heading = props.mode === "listen" && props.stage === "ask"
    ? "Listen"
    : props.mode === "type"
      ? promptEn(props.item)
      : null;
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="progress" aria-hidden="true"><i style={{ width: `${((props.index + 1) / props.total) * 100}%` }} /></div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">{props.index + 1} / {props.total}</span>
        <button className="btn ghost" type="button" onClick={props.onHelp}>Keys</button>
      </div>
      <article className="card study-card">
        <div className="row">
          <span className="chip">{props.item.kind === "word" ? props.item.word.pos : props.item.phrase.category}</span>
          {props.item.kind === "word" && <span className="muted">#{props.item.word.rank}</span>}
          {props.item.kind === "word" && props.item.word.pos === "verb" && isIrregularVerb(props.item.word.lemma) && <span className="muted">irregular</span>}
          <button className="icon-btn" type="button" onClick={props.onSpeak} aria-label="Play Spanish">♪</button>
        </div>
        {heading !== null ? (
          <h2 className={heading.length > 42 ? "gloss" : "lemma"}>{heading}</h2>
        ) : (
          <h2 className="lemma"><Spanish item={props.item} /></h2>
        )}
        {props.stage === "grade" && (
          <p className="gloss">{props.mode === "type" ? promptEs(props.item) : promptEn(props.item)}</p>
        )}
        {props.stage === "grade" && props.item.kind === "word" && props.item.word.example && (
          <blockquote className="example">
            <p>{props.item.word.example.es}</p>
            <p className="en">{props.item.word.example.en}</p>
          </blockquote>
        )}
        {props.verdict && (
          <div className={`verdict ${props.verdict.result}`}>
            {props.verdict.result === "correct" && "That’s it."}
            {props.verdict.result === "accent" && `Almost. The accent is the difference: ${props.verdict.suggestion}`}
            {props.verdict.result === "wrong" && `Answer: ${props.verdict.suggestion ?? (spanishFirst ? promptEn(props.item) : promptEs(props.item))}`}
          </div>
        )}
        {(props.mode === "choice" || props.mode === "listen") && (
          <div className="choices">
            {props.choices.map((option) => {
              const revealed = props.stage === "grade";
              const right = revealed && option === correctChoice;
              const wrong = revealed && option === props.picked && option !== correctChoice;
              return (
                <button key={option} className={`choice${right ? " right" : ""}${wrong ? " wrong" : ""}`} type="button" disabled={props.stage === "grade"} onClick={() => props.onPick(option)}>
                  {option}
                </button>
              );
            })}
          </div>
        )}
        {props.mode === "type" && props.stage !== "grade" && (
          <>
            <div className="accent-bar">
              {ACCENTS.map((char) => (
                <button key={char} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => props.onAccent(char)}>{char}</button>
              ))}
            </div>
            <input
              ref={props.inputRef}
              type="text"
              value={props.typed}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Type the Spanish"
              onChange={(event) => props.setTyped(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onSubmit();
              }}
            />
            <button className="btn primary" type="button" onClick={props.onSubmit}>Check</button>
          </>
        )}
        {props.mode === "reveal" && props.stage === "ask" && (
          <button className="btn primary wide" type="button" onClick={props.onReveal}>Show meaning</button>
        )}
      </article>
      {props.stage === "grade" && (
        <div className="rates">
          {(["again", "hard", "good", "easy"] as const).map((rating) => {
            const next = reviewCard(props.card, rating, Date.now());
            const label = rating === "again" ? "10m" : `${next.interval}d`;
            return (
              <button key={rating} className={`rate ${rating}`} type="button" onClick={() => props.onGrade(rating)}>
                {rating}<small>{label}</small>
              </button>
            );
          })}
        </div>
      )}
      <p className="kbd">Space reveals · 1–4 rate · Enter checks typing</p>
    </section>
  );
}

function Spanish({ item }: { item: StudyItem }) {
  if (item.kind === "phrase") return item.phrase.es;
  const word: Word = item.word;
  if (!word.article || word.article === "el/la") return word.lemma;
  return <><span className="article">{word.article}</span>{word.lemma}</>;
}
