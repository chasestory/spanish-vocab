import { foldAccents } from "./answer.ts";
import { isIrregularVerb } from "./conjugate.ts";
import type { CardState } from "./srs.ts";
import type { Filters, Phrase, Word } from "./types.ts";

export type StudyItem =
  | { kind: "word"; id: string; word: Word }
  | { kind: "phrase"; id: string; phrase: Phrase };

export function inBand(rank: number, filters: Filters): boolean {
  if (filters.band === "custom") return rank >= filters.rankMin && rank <= filters.rankMax;
  return rank <= filters.band;
}

export function wordMatches(word: Word, filters: Filters): boolean {
  if (!inBand(word.rank, filters)) return false;
  if (filters.irregularOnly) return word.pos === "verb" && isIrregularVerb(word.lemma);
  if (filters.poses.length > 0 && !filters.poses.includes(word.pos)) return false;
  return true;
}

export function phraseMatches(phrase: Phrase, filters: Filters): boolean {
  return filters.category === "all" || phrase.category === filters.category;
}

export function buildQueue(
  words: Word[],
  phrases: Phrase[],
  cards: Map<string, CardState>,
  filters: Filters,
  newRemaining: number,
  now: number,
): StudyItem[] {
  const pool: StudyItem[] = [];
  const wantWords = filters.pool !== "deck" || filters.source !== "phrases";
  const wantPhrases = filters.pool !== "deck" || filters.source !== "words";
  if (wantWords) {
    for (const word of words) {
      if (filters.pool === "deck" && !wordMatches(word, filters)) continue;
      pool.push({ kind: "word", id: word.id, word });
    }
  }
  if (wantPhrases) {
    for (const phrase of phrases) {
      if (filters.pool === "deck" && !phraseMatches(phrase, filters)) continue;
      pool.push({ kind: "phrase", id: phrase.id, phrase });
    }
  }
  const due: { item: StudyItem; due: number }[] = [];
  const fresh: StudyItem[] = [];
  for (const item of pool) {
    const card = cards.get(item.id);
    if (filters.pool === "starred" && !card?.starred) continue;
    if (filters.pool === "difficult" && !((card?.lapses ?? 0) >= 2)) continue;
    if (!card || card.status === "new") fresh.push(item);
    else if (card.due <= now) due.push({ item, due: card.due });
  }
  due.sort((a, b) => a.due - b.due);
  const news = filters.pool === "deck" ? fresh.slice(0, Math.max(0, newRemaining)) : fresh.slice(0, 40);
  return [...due.map((row) => row.item), ...news].slice(0, 80);
}

export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = swap as T;
  }
  return copy;
}

export function choiceOptions(correct: string, distractors: string[]): string[] {
  const unique = [...new Set(distractors.filter((item) => foldAccents(item) !== foldAccents(correct)))];
  return shuffle([correct, ...shuffle(unique).slice(0, 3)]);
}

export function searchMatch(query: string, lemma: string, gloss: string): boolean {
  const q = foldAccents(query);
  if (!q) return true;
  return foldAccents(lemma).includes(q) || foldAccents(gloss).includes(q);
}
