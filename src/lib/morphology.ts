import type { Word } from "./types.ts";

export type Gender = "m" | "f" | "mf";

/** Meaning changes and article exceptions the frequency list only stores once. */
export const GENDER_NOTES: Record<string, string> = {
  agua: "Feminine, but it takes el and un in the singular because it starts with a stressed a. Plural: las aguas.",
  alma: "Feminine, but el alma in the singular. Plural: las almas.",
  águila: "Feminine, but el águila in the singular.",
  hambre: "Feminine, but el hambre.",
  arma: "Feminine, but el arma in the singular. Plural: las armas.",
  hada: "Feminine, but el hada.",
  hacha: "Feminine, but el hacha.",
  área: "Feminine, but el área.",
  aula: "Feminine, but el aula.",
  ama: "Feminine, but el ama when it means a female owner or housekeeper.",
  habla: "Feminine, but el habla (speech).",
  mapa: "Masculine, even though it ends in -a: el mapa.",
  día: "Masculine, even though it ends in -a: el día.",
  problema: "Masculine, like most Greek -ma nouns: el problema.",
  programa: "Masculine: el programa.",
  sistema: "Masculine: el sistema.",
  idioma: "Masculine: el idioma.",
  clima: "Masculine: el clima.",
  tema: "Masculine: el tema.",
  mano: "Feminine, even though it ends in -o: la mano.",
  foto: "Feminine, short for la fotografía.",
  moto: "Feminine, short for la motocicleta.",
  radio: "el radio is a device, a radius, or the element. la radio is radio broadcasting.",
  capital: "el capital is money. la capital is the capital city.",
  orden: "el orden is arrangement or sequence. la orden is a command or a religious order.",
  arte: "The singular is usually el arte. The plural is las artes.",
  papa: "el Papa is the pope. la papa is the potato in much of Latin America.",
  corte: "el corte is a cut. la corte is a court.",
  frente: "el frente is a front, as in weather or a building. la frente is the forehead.",
  coma: "el coma is a medical coma. la coma is the punctuation mark.",
  moral: "el moral is a mulberry tree. la moral is morals or morale.",
  cura: "el cura is a priest. la cura is a cure.",
  policía: "el policía or la policía is an officer. la policía is also the police force.",
  guía: "el guía or la guía is a person who guides. la guía is also a guidebook.",
  estudiante: "Same word for both: el estudiante, la estudiante.",
};

const INVARIABLE_OR = new Set(
  "mejor peor mayor menor superior inferior exterior interior anterior posterior ulterior".split(" "),
);

function baseVowel(ch: string): string {
  return ch.normalize("NFD").replace(/[\u0301\u0308]/g, "").normalize("NFC");
}

function vowelKind(ch: string): "strong" | "weak" | null {
  const base = baseVowel(ch);
  if (base === "a" || base === "e" || base === "o") return "strong";
  if (base === "i" || base === "u") return "weak";
  return null;
}

function syllables(word: string): { start: number; end: number; stress: number }[] {
  const chars = [...word];
  const out: { start: number; end: number; stress: number }[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!vowelKind(chars[i] ?? "")) {
      i += 1;
      continue;
    }
    const group = [i];
    i += 1;
    while (i < chars.length && vowelKind(chars[i] ?? "")) {
      const prev = chars[i - 1] ?? "";
      const cur = chars[i] ?? "";
      const hiatus =
        (vowelKind(prev) === "strong" && vowelKind(cur) === "strong") ||
        (vowelKind(prev) === "weak" && prev !== baseVowel(prev)) ||
        (vowelKind(cur) === "weak" && cur !== baseVowel(cur));
      if (hiatus) break;
      group.push(i);
      i += 1;
    }
    const accented = group.find((index) => (chars[index] ?? "") !== baseVowel(chars[index] ?? ""));
    const strong = group.find((index) => vowelKind(chars[index] ?? "") === "strong");
    out.push({ start: group[0] ?? 0, end: group[group.length - 1] ?? 0, stress: accented ?? strong ?? group[0] ?? 0 });
  }
  return out;
}

function stressIndex(word: string): number {
  const chars = [...word];
  const syls = syllables(word);
  if (!syls.length) return 0;
  const accented = chars.findIndex((ch) => /[áéíóú]/.test(ch));
  if (accented >= 0) return syls.find((item) => accented >= item.start && accented <= item.end)?.stress ?? accented;
  if (syls.length === 1) return syls[0]?.stress ?? 0;
  const last = baseVowel(chars[chars.length - 1] ?? "");
  const soft = "aeiouns".includes(last);
  return syls[soft ? syls.length - 2 : syls.length - 1]?.stress ?? 0;
}

function applyStress(word: string, stress: number): string {
  const chars = [...word].map((ch) => baseVowel(ch));
  const syls = syllables(chars.join(""));
  const sylIndex = Math.max(0, syls.findIndex((item) => stress >= item.start && stress <= item.end));
  const last = baseVowel(chars[chars.length - 1] ?? "");
  const fallback = "aeiouns".includes(last) ? Math.max(0, syls.length - 2) : Math.max(0, syls.length - 1);
  const base = chars[stress] ?? "";
  const neighbor = vowelKind(chars[stress - 1] ?? "") || vowelKind(chars[stress + 1] ?? "");
  const hiatus = (base === "i" || base === "u") && Boolean(neighbor);
  if (sylIndex === fallback && !hiatus) return chars.join("");
  const accent: Record<string, string> = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
  if (accent[base]) chars[stress] = accent[base];
  return chars.join("");
}

export function pluralize(lemma: string): string {
  const word = lemma.trim();
  const stress = stressIndex(word);
  let stem = word;
  let ending = "s";
  if (stem.endsWith("z")) {
    stem = `${stem.slice(0, -1)}c`;
    ending = "es";
  } else if (/[aeiouáéíóúü]$/i.test(stem)) {
    ending = "s";
  } else {
    ending = "es";
  }
  const index = Math.min(stress, stem.length - 1);
  return applyStress(stem + ending, index);
}

export function indefiniteArticle(article: string | null): string | null {
  if (article === "el") return "un";
  if (article === "la") return "una";
  if (article === "los") return "unos";
  if (article === "las") return "unas";
  if (article === "el/la") return "un/una";
  return null;
}

export interface NounForms {
  gender: Gender | null;
  article: string | null;
  indefinite: string | null;
  plural: string;
  pluralArticle: string | null;
  note?: string;
}

export function nounForms(word: Pick<Word, "lemma" | "gender" | "article">): NounForms {
  const plural = pluralize(word.lemma);
  const pluralArticle = word.article === "el" || word.article === "la" ? (word.gender === "f" ? "las" : word.gender === "m" ? "los" : "los/las")
    : word.article === "los" ? "los"
    : word.article === "las" ? "las"
    : word.article === "el/la" ? "los/las"
    : null;
  const note = GENDER_NOTES[word.lemma];
  return {
    gender: word.gender,
    article: word.article,
    indefinite: indefiniteArticle(word.article),
    plural,
    pluralArticle,
    ...(note ? { note } : {}),
  };
}

export interface AdjectiveForms {
  masculine: string;
  feminine: string;
  masculinePlural: string;
  femininePlural: string;
  note?: string;
}

const APOCOPE: Record<string, string> = {
  buen: "A short form of bueno, used before a singular masculine noun.",
  gran: "A short form of grande, used before a singular noun.",
  algún: "A short form of alguno, used before a masculine singular noun.",
  ningún: "A short form of ninguno, used before a masculine singular noun.",
  primer: "A short form of primero, used before a masculine singular noun.",
  tercer: "A short form of tercero, used before a masculine singular noun.",
};

export function adjectiveForms(lemma: string): AdjectiveForms {
  const word = lemma.trim().toLowerCase();
  const note = APOCOPE[word];
  let masculine = word;
  let feminine = word;
  if (word.endsWith("o")) feminine = `${word.slice(0, -1)}a`;
  else if (word.endsWith("ón") || word.endsWith("án") || word.endsWith("ín")) {
    masculine = word;
    feminine = `${word.slice(0, -2)}a`;
  } else if (word.endsWith("és")) {
    feminine = `${word.slice(0, -2)}esa`;
  } else if (word.endsWith("or") && !INVARIABLE_OR.has(word)) {
    feminine = `${word}a`;
  }
  const masculinePlural = pluralize(masculine);
  const femininePlural = pluralize(feminine);
  return note
    ? { masculine, feminine, masculinePlural, femininePlural, note }
    : { masculine, feminine, masculinePlural, femininePlural };
}

export function genderLabel(gender: Gender | null): string | null {
  if (gender === "m") return "M";
  if (gender === "f") return "F";
  if (gender === "mf") return "M/F";
  return null;
}
