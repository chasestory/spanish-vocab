import type { CorpusMeta, Phrase, Word } from "./types.ts";

export interface Corpus {
  words: Word[];
  phrases: Phrase[];
  meta: CorpusMeta;
  byId: Map<string, Word | Phrase>;
}

let pending: Promise<Corpus> | null = null;

export function loadCorpus(): Promise<Corpus> {
  if (!pending) pending = fetchCorpus();
  return pending;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json() as Promise<T>;
}

async function fetchCorpus(): Promise<Corpus> {
  const [words, phrases, meta] = await Promise.all([
    fetchJson<Word[]>("data/words.json"),
    fetchJson<Phrase[]>("data/phrases.json"),
    fetchJson<CorpusMeta>("data/meta.json"),
  ]);
  const byId = new Map<string, Word | Phrase>();
  for (const word of words) byId.set(word.id, word);
  for (const phrase of phrases) byId.set(phrase.id, phrase);
  return { words, phrases, meta, byId };
}

export function isWord(item: Word | Phrase): item is Word {
  return "lemma" in item;
}
