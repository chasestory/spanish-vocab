export type Pos =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "determiner"
  | "interjection"
  | "number";

export interface Example {
  es: string;
  en: string;
  source?: string;
}

export interface Word {
  id: string;
  lemma: string;
  rank: number;
  freq: number;
  pos: Pos;
  gloss: string;
  senses: string[];
  gender: "m" | "f" | "mf" | null;
  article: string | null;
  note?: string;
  example?: Example;
}

export interface Phrase {
  id: string;
  es: string;
  en: string;
  category: string;
  tatoeba: number;
  by?: string;
}

export interface CorpusMeta {
  wordCount: number;
  phraseCount: number;
  withExample: number;
  sources: { name: string; url: string; license: string; note: string }[];
  filters: string[];
}

export type StudyMode = "reveal" | "type" | "choice" | "listen";
export type Band = 100 | 500 | 1000 | 2000 | 3000 | 5000 | "custom";
export type Pool = "deck" | "starred" | "difficult";

export interface Filters {
  band: Band;
  rankMin: number;
  rankMax: number;
  poses: Pos[];
  irregularOnly: boolean;
  source: "words" | "phrases" | "both";
  category: string;
  mode: StudyMode;
  pool: Pool;
}

export interface Settings {
  region: "latam" | "spain";
  dailyGoal: number;
  newPerDay: number;
  rate: number;
  voiceURI: string;
  theme: "system" | "light" | "dark";
}

export interface MetaState {
  streak: number;
  lastStreakDate: string | null;
  newToday: number;
  newTodayDate: string | null;
  reviewsToday: number;
  reviewsTodayDate: string | null;
}

export const POS_LABEL: Record<Pos, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  adverb: "Adverb",
  pronoun: "Pronoun",
  preposition: "Preposition",
  conjunction: "Conjunction",
  determiner: "Determiner",
  interjection: "Interjection",
  number: "Number",
};

export const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "greetings", label: "Greetings" },
  { id: "politeness", label: "Politeness" },
  { id: "introductions", label: "Introductions" },
  { id: "smalltalk", label: "Small talk" },
  { id: "feelings", label: "Feelings" },
  { id: "questions", label: "Questions" },
  { id: "time", label: "Time" },
  { id: "weather", label: "Weather" },
  { id: "directions", label: "Directions" },
  { id: "transport", label: "Transport" },
  { id: "travel", label: "Travel" },
  { id: "hotel", label: "Hotel" },
  { id: "food", label: "Food" },
  { id: "restaurant", label: "Restaurant" },
  { id: "shopping", label: "Shopping" },
  { id: "money", label: "Money" },
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "health", label: "Health" },
  { id: "emergencies", label: "Emergencies" },
  { id: "phone", label: "Phone" },
  { id: "opinions", label: "Opinions" },
  { id: "plans", label: "Plans" },
  { id: "idioms", label: "Idioms" },
  { id: "everyday", label: "Everyday" },
];

export const defaultSettings: Settings = {
  region: "latam",
  dailyGoal: 20,
  newPerDay: 15,
  rate: 0.92,
  voiceURI: "",
  theme: "system",
};

export const defaultFilters: Filters = {
  band: 500,
  rankMin: 1,
  rankMax: 500,
  poses: [],
  irregularOnly: false,
  source: "words",
  category: "all",
  mode: "reveal",
  pool: "deck",
};

export const defaultMeta = (): MetaState => ({
  streak: 0,
  lastStreakDate: null,
  newToday: 0,
  newTodayDate: null,
  reviewsToday: 0,
  reviewsTodayDate: null,
});
