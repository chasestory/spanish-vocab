const ARTICLE = /^(el|la|los|las|un|una)\s+/;

export type AnswerResult = "correct" | "accent" | "wrong";

export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[¿?¡!.,;:'"“”«»()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function foldAccents(value: string): string {
  return normalizeAnswer(value)
    .normalize("NFD")
    .replace(/[\u0301\u0308]/g, "")
    .replace(/ñ/g, "n");
}

function dropArticle(value: string): string | null {
  const next = value.replace(ARTICLE, "");
  if (!next || next === value) return null;
  return next;
}

/** Accept glosses, lemmas, an optional leading article, and a verb gloss with or without "to". */
export function acceptedAnswers(expected: string[]): string[] {
  const out = new Set<string>();
  for (const raw of expected) {
    for (const part of raw.split(";")) {
      const base = normalizeAnswer(part.replace(/\([^)]*\)/g, " "));
      if (!base) continue;
      out.add(base);
      const bare = dropArticle(base);
      if (bare) out.add(bare);
      const noTo = base.replace(/^to\s+/, "");
      if (noTo !== base) out.add(noTo);
    }
  }
  return [...out];
}

const LEADING_SUBJECT = /^(yo|tú|tu|él|ella|usted|nosotros|nosotras|vosotros|vosotras|ellos|ellas|ustedes)\s+/;

/** Case, punctuation, and an optional leading subject. Accents still matter. */
export function checkNormalized(input: string, expected: string[]): { result: AnswerResult; suggestion?: string } {
  const got = normalizeAnswer(input).replace(LEADING_SUBJECT, "");
  const answers = expected.map((item) => ({ raw: item.trim(), norm: normalizeAnswer(item) })).filter((item) => item.norm);
  if (!got) return { result: "wrong", suggestion: answers[0]?.raw };
  if (answers.some((item) => item.norm === got)) return { result: "correct" };
  const folded = foldAccents(got);
  const match = answers.find((item) => foldAccents(item.norm) === folded);
  if (match) return { result: "accent", suggestion: match.raw };
  return { result: "wrong", suggestion: answers[0]?.raw };
}

export function checkAnswer(input: string, expected: string[]): { result: AnswerResult; suggestion?: string } {
  const answers = acceptedAnswers(expected);
  const got = normalizeAnswer(input);
  const gotBare = dropArticle(got) ?? got;
  if (!got) return { result: "wrong" };
  if (answers.some((answer) => answer === got || answer === gotBare)) return { result: "correct" };
  const folded = foldAccents(gotBare);
  const match = answers.find((answer) => foldAccents(answer) === folded);
  if (match) return { result: "accent", suggestion: match };
  return { result: "wrong" };
}
