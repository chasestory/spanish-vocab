import { GRAMMAR, type GrammarQuestion } from "../data/grammar.ts";
import { PREPOSITIONS, type PrepEntry } from "../data/prepositions.ts";
import { PRONOUN_EXERCISES, type PronounExercise } from "../data/pronouns.ts";
import { THEMES, themeById, themeCardId, type ThemeItem } from "../data/themes.ts";
import {
  conjugate,
  PERSONS,
  type FiniteTense,
  type Person,
  type Tense,
} from "./conjugate.ts";
import { phraseMatches, wordMatches } from "./deck.ts";
import type { CardState } from "./srs.ts";
import type { Filters, Phrase, StudyMode, Word } from "./types.ts";

export type StudyCard =
  | { kind: "word"; id: string; word: Word }
  | { kind: "phrase"; id: string; phrase: Phrase }
  | { kind: "theme"; id: string; themeId: string; themeTitle: string; item: ThemeItem }
  | { kind: "prep"; id: string; entry: PrepEntry }
  | { kind: "pronoun"; id: string; exercise: PronounExercise }
  | { kind: "grammar"; id: string; lessonId: string; lessonTitle: string; question: GrammarQuestion }
  | { kind: "conj"; id: string; lemma: string; gloss: string; tense: Tense; person: Person; answer: string }
  | { kind: "gender"; id: string; word: Word };

export type Presentation = "reveal" | "type" | "choice" | "match";

export interface Step {
  presentation: Presentation;
  cards: StudyCard[];
}

const CONJ_TENSES: Tense[] = [
  "present",
  "preterite",
  "imperfect",
  "future",
  "conditional",
  "presentSubjunctive",
  "imperfectSubjunctive",
  "imperative",
];

function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 33 + text.charCodeAt(i)) >>> 0;
  return value;
}

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length] as T;
}

function peopleFor(region: "latam" | "spain"): Person[] {
  return region === "spain" ? [...PERSONS] : PERSONS.filter((person) => person !== "vosotros");
}

function conjAnswer(lemma: string, tense: Tense, person: Person): string | null {
  const paradigm = conjugate(lemma);
  if (!paradigm) return null;
  if (tense === "imperative") return paradigm.imperative[person === "yo" ? "tu" : person];
  return paradigm[tense][person];
}

function cardDue(card: CardState | undefined, now: number): boolean {
  return !!card && card.status !== "new" && card.due <= now;
}

function allow(card: CardState | undefined, filters: Filters): boolean {
  if (filters.pool === "starred") return Boolean(card?.starred);
  if (filters.pool === "difficult") return (card?.lapses ?? 0) >= 2;
  return true;
}

function pushSplit(
  due: StudyCard[],
  fresh: StudyCard[],
  item: StudyCard,
  cards: Map<string, CardState>,
  filters: Filters,
  now: number,
) {
  const state = cards.get(item.id);
  if (!allow(state, filters)) return;
  if (filters.pool !== "deck") {
    due.push(item);
    return;
  }
  if (!state || state.status === "new") fresh.push(item);
  else if (cardDue(state, now)) due.push(item);
}

export function selectionSummary(filters: Filters): string {
  const sets = filters.sets.length ? filters.sets : ["words"];
  const labels: Record<string, string> = {
    words: "words",
    phrases: "phrases",
    verbs: "verb forms",
    prepositions: "prepositions",
    pronouns: "pronouns",
    themes: "themes",
    gender: "noun gender",
    grammar: "grammar",
  };
  const names = sets.map((set) => labels[set] ?? set);
  const band = filters.band === "custom" ? `ranks ${filters.rankMin}–${filters.rankMax}` : `top ${filters.band}`;
  const themeNames = filters.themes.map((id) => themeById(id)?.title).filter(Boolean);
  const extra = sets.includes("themes") && themeNames.length ? themeNames.slice(0, 2).join(", ") : "";
  return [names.join(" · "), sets.includes("words") || sets.includes("verbs") || sets.includes("gender") ? band : "", extra]
    .filter(Boolean)
    .join(" · ");
}

export function buildSession(
  words: Word[],
  phrases: Phrase[],
  cards: Map<string, CardState>,
  filters: Filters,
  newRemaining: number,
  now: number,
  region: "latam" | "spain",
): StudyCard[] {
  const sets = new Set(filters.sets.length ? filters.sets : ["words" as const]);
  const due: StudyCard[] = [];
  const fresh: StudyCard[] = [];

  if (sets.has("words")) {
    for (const word of words) {
      if (!wordMatches(word, filters)) continue;
      pushSplit(due, fresh, { kind: "word", id: word.id, word }, cards, filters, now);
    }
  }
  if (sets.has("gender")) {
    for (const word of words) {
      if (word.pos !== "noun" || !word.article) continue;
      if (!wordMatches({ ...word }, { ...filters, irregularOnly: false, poses: filters.poses.length ? filters.poses : ["noun"] })) continue;
      if (filters.poses.length && !filters.poses.includes("noun")) continue;
      pushSplit(due, fresh, { kind: "gender", id: `gender:${word.id}`, word }, cards, filters, now);
    }
  }
  if (sets.has("phrases")) {
    for (const phrase of phrases) {
      if (!phraseMatches(phrase, filters)) continue;
      pushSplit(due, fresh, { kind: "phrase", id: phrase.id, phrase }, cards, filters, now);
    }
  }
  if (sets.has("themes")) {
    const chosen = filters.themes.length ? THEMES.filter((theme) => filters.themes.includes(theme.id)) : THEMES;
    for (const theme of chosen) {
      for (const item of theme.items) {
        pushSplit(
          due,
          fresh,
          { kind: "theme", id: themeCardId(theme.id, item), themeId: theme.id, themeTitle: theme.title, item },
          cards,
          filters,
          now,
        );
      }
    }
  }
  if (sets.has("prepositions")) {
    for (const entry of PREPOSITIONS) {
      pushSplit(due, fresh, { kind: "prep", id: `prep:${entry.id}`, entry }, cards, filters, now);
    }
  }
  if (sets.has("pronouns")) {
    for (const exercise of PRONOUN_EXERCISES) {
      pushSplit(due, fresh, { kind: "pronoun", id: `pron:${exercise.id}`, exercise }, cards, filters, now);
    }
  }
  if (sets.has("grammar")) {
    for (const lesson of GRAMMAR) {
      lesson.questions.forEach((question, index) => {
        pushSplit(
          due,
          fresh,
          { kind: "grammar", id: `gram:${lesson.id}:${index}`, lessonId: lesson.id, lessonTitle: lesson.title, question },
          cards,
          filters,
          now,
        );
      });
    }
  }
  if (sets.has("verbs")) {
    const verbs = words.filter((word) => word.pos === "verb" && wordMatches(word, { ...filters, poses: ["verb"] }));
    const people = peopleFor(region);
    for (const [id, state] of cards) {
      if (!id.startsWith("conj:") || !cardDue(state, now) || !allow(state, filters)) continue;
      const [, lemma, tense, person] = id.split(":");
      if (!lemma || !tense || !person) continue;
      if (!verbs.some((word) => word.lemma === lemma) && filters.pool === "deck") continue;
      const answer = conjAnswer(lemma, tense as Tense, person as Person);
      const gloss = words.find((word) => word.lemma === lemma)?.gloss ?? "";
      if (!answer) continue;
      due.push({ kind: "conj", id, lemma, gloss, tense: tense as Tense, person: person as Person, answer });
    }
    const sample = verbs.slice(0, 400);
    for (const word of sample) {
      const seed = hash(`${word.lemma}:${filters.band}`);
      const tense = pick(CONJ_TENSES, seed);
      const person = pick(people, seed >>> 3);
      const answer = conjAnswer(word.lemma, tense, person);
      if (!answer) continue;
      const id = `conj:${word.lemma}:${tense}:${person}`;
      pushSplit(
        due,
        fresh,
        { kind: "conj", id, lemma: word.lemma, gloss: word.senses[0] || word.gloss, tense, person, answer },
        cards,
        filters,
        now,
      );
    }
  }

  due.sort((a, b) => (cards.get(a.id)?.due ?? 0) - (cards.get(b.id)?.due ?? 0));
  const news = filters.pool === "deck" ? fresh.slice(0, Math.max(0, Math.min(newRemaining, 15))) : fresh.slice(0, 20);
  let queue = [...due, ...news].slice(0, 36);
  if (!queue.length && filters.pool === "deck") queue = fresh.slice(0, 12);
  const seen = new Set<string>();
  return queue.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

function translatable(card: StudyCard): boolean {
  return card.kind === "word" || card.kind === "phrase" || card.kind === "theme";
}

function single(card: StudyCard, presentation: Presentation): Presentation {
  if (card.kind === "gender") return "choice";
  if (card.kind === "conj") return presentation === "choice" ? "choice" : "type";
  if (card.kind === "pronoun") {
    if (presentation === "choice" && card.exercise.choices) return "choice";
    if (presentation === "reveal") return "reveal";
    return "type";
  }
  if (card.kind === "grammar") return card.question.choices && presentation !== "type" ? "choice" : presentation === "reveal" ? "reveal" : "type";
  if (card.kind === "prep") return presentation === "reveal" ? "reveal" : presentation === "choice" ? "choice" : "type";
  if (presentation === "match") return "choice";
  return presentation;
}

export function buildSteps(cards: StudyCard[], mode: StudyMode): Step[] {
  const steps: Step[] = [];
  if (mode === "match") {
    let bucket: StudyCard[] = [];
    const flush = () => {
      if (bucket.length >= 2) steps.push({ presentation: "match", cards: bucket.splice(0, 4) });
      while (bucket.length) {
        const card = bucket.shift();
        if (card) steps.push({ presentation: single(card, "choice"), cards: [card] });
      }
    };
    for (const card of cards) {
      if (!translatable(card)) {
        flush();
        steps.push({ presentation: single(card, "type"), cards: [card] });
        continue;
      }
      bucket.push(card);
      if (bucket.length === 4) flush();
    }
    flush();
    return steps;
  }
  const cycle: Presentation[] = mode === "mix"
    ? ["choice", "type", "reveal"]
    : mode === "listen"
      ? ["choice"]
      : [mode === "reveal" || mode === "type" || mode === "choice" ? mode : "reveal"];
  let index = 0;
  let pending: StudyCard[] = [];
  const flushMatch = () => {
    if (pending.length >= 4) steps.push({ presentation: "match", cards: pending.splice(0, 4) });
  };
  for (const card of cards) {
    if (mode === "mix" && translatable(card) && index % 5 === 4) {
      pending.push(card);
      flushMatch();
      index += 1;
      continue;
    }
    flushMatch();
    const preferred = cycle[index % cycle.length] ?? "reveal";
    steps.push({ presentation: single(card, preferred), cards: [card] });
    index += 1;
  }
  if (pending.length >= 2) steps.push({ presentation: "match", cards: pending });
  else {
    for (const card of pending) steps.push({ presentation: "choice", cards: [card] });
  }
  return steps;
}

export function spanishOf(card: StudyCard): string {
  if (card.kind === "word") {
    return card.word.article && card.word.article !== "el/la" ? `${card.word.article} ${card.word.lemma}` : card.word.lemma;
  }
  if (card.kind === "phrase") return card.phrase.es;
  if (card.kind === "theme") return card.item.es;
  if (card.kind === "prep") return card.entry.verb;
  if (card.kind === "pronoun") return card.exercise.prompt;
  if (card.kind === "grammar") return card.question.prompt;
  if (card.kind === "gender") return card.word.lemma;
  return `${card.lemma} · ${card.tense} · ${card.person}`;
}

function firstGloss(text: string): string {
  return text.split(";")[0]?.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim() || text;
}

export function englishOf(card: StudyCard): string {
  if (card.kind === "word") return firstGloss(card.word.senses[0] || card.word.gloss);
  if (card.kind === "phrase") return card.phrase.en;
  if (card.kind === "theme") return card.item.en;
  if (card.kind === "prep") return card.entry.gloss;
  if (card.kind === "pronoun") return card.exercise.answers[0] ?? "";
  if (card.kind === "grammar") return card.question.answers[0] ?? "";
  if (card.kind === "gender") return card.word.article ?? "";
  return card.answer;
}

export function expectedOf(card: StudyCard, presentation: Presentation): string[] {
  if (card.kind === "word") {
    const answers = [card.word.lemma, ...(card.word.article ? [`${card.word.article} ${card.word.lemma}`] : [])];
    return presentation === "type" ? answers : [card.word.gloss, ...card.word.senses];
  }
  if (card.kind === "phrase") return presentation === "type" ? [card.phrase.es] : [card.phrase.en];
  if (card.kind === "theme") {
    const bare = card.item.lemma ?? card.item.es;
    return presentation === "type" ? [card.item.es, bare] : [card.item.en];
  }
  if (card.kind === "prep") return [card.entry.prep];
  if (card.kind === "pronoun") return card.exercise.answers;
  if (card.kind === "grammar") return card.question.answers;
  if (card.kind === "gender") {
    if (card.word.article === "el/la" || card.word.gender === "mf") return ["el", "la", "el/la", "either"];
    return [card.word.article === "los" ? "el" : card.word.article === "las" ? "la" : card.word.article ?? ""];
  }
  return [card.answer];
}

export function choicePool(card: StudyCard, words: Word[], phrases: Phrase[]): string[] {
  if (card.kind === "gender") return ["el", "la", "either"];
  if (card.kind === "prep") return ["a", "de", "en", "con", "por", "para"];
  if (card.kind === "pronoun" && card.exercise.choices) return card.exercise.choices;
  if (card.kind === "grammar" && card.question.choices) return card.question.choices;
  if (card.kind === "conj") {
    const paradigm = conjugate(card.lemma);
    if (!paradigm) return [card.answer];
    const tense = card.tense === "imperative" ? "present" : card.tense;
    const forms = PERSONS.map((person) => paradigm[tense as FiniteTense][person]);
    return [card.answer, ...forms];
  }
  if (card.kind === "phrase") return phrases.map((phrase) => phrase.en);
  if (card.kind === "theme") return [card.item.en];
  if (card.kind === "word") {
    return words.filter((word) => word.pos === card.word.pos).map((word) => firstGloss(word.senses[0] || word.gloss));
  }
  return [englishOf(card)];
}
