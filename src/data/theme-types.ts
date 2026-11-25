export interface ThemeItem {
  es: string;
  en: string;
  gender?: "m" | "f" | "mf";
  article?: string;
  lemma?: string;
  example: string;
  exampleEn: string;
}

export interface Theme {
  id: string;
  title: string;
  group: string;
  blurb: string;
  items: ThemeItem[];
}

type Gender = "m" | "f" | "mf";

export function noun(es: string, gender: Gender, en: string, example: string, exampleEn: string): ThemeItem {
  const match = /^(el\/la|los\/las|el|la|los|las)\s+(.+)$/.exec(es);
  return {
    es,
    en,
    gender,
    example,
    exampleEn,
    ...(match ? { article: match[1], lemma: match[2] } : {}),
  };
}

export function phrase(es: string, en: string, example: string, exampleEn: string): ThemeItem {
  return { es, en, example, exampleEn };
}
