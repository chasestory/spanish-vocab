import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conjugate } from "./conjugate.ts";
import type { Phrase, Word } from "./types.ts";

const words = JSON.parse(readFileSync(new URL("../../public/data/words.json", import.meta.url), "utf8")) as Word[];
const phrases = JSON.parse(readFileSync(new URL("../../public/data/phrases.json", import.meta.url), "utf8")) as Phrase[];

describe("shipped dataset", () => {
  it("has 5,000 ranked lemmas and about 2,000 phrases", () => {
    expect(words).toHaveLength(5000);
    expect(phrases.length).toBeGreaterThanOrEqual(1800);
    expect(new Set(words.map((word) => word.rank)).size).toBe(5000);
    expect(words[0]?.rank).toBe(1);
    expect(words.at(-1)?.rank).toBe(5000);
    for (let i = 1; i < words.length; i += 1) {
      expect(words[i]!.freq).toBeLessThanOrEqual(words[i - 1]!.freq);
      expect(words[i]!.gloss.length).toBeGreaterThan(0);
      expect(words[i]!.senses.length).toBeGreaterThan(0);
    }
  });

  it("keeps core headwords and noun articles from the dictionary", () => {
    const by = new Map(words.map((word) => [word.lemma, word]));
    expect(by.get("ser")?.pos).toBe("verb");
    expect(by.get("ser")?.gloss.toLowerCase()).toContain("to be");
    expect(by.get("ir")?.gloss.toLowerCase().startsWith("to go")).toBe(true);
    expect(by.get("casa")?.article).toBe("la");
    expect(by.get("agua")?.article).toBe("el");
    expect(by.get("agua")?.gender).toBe("f");
    expect(by.get("del")?.gloss.toLowerCase()).toContain("of the");
    const nouns = words.filter((word) => word.pos === "noun" && word.gender);
    expect(nouns.every((word) => word.article)).toBe(true);
  });

  it("conjugates deck verbs and counts irregulars", () => {
    const kinds = { regular: 0, spelling: 0, stem: 0, irregular: 0, skipped: 0 };
    for (const word of words) {
      if (word.pos !== "verb") continue;
      const paradigm = conjugate(word.lemma);
      if (!paradigm) {
        kinds.skipped += 1;
        continue;
      }
      kinds[paradigm.kind] += 1;
    }
    expect(kinds.irregular).toBeGreaterThan(40);
    expect(kinds.stem + kinds.spelling + kinds.irregular).toBeGreaterThan(80);
    expect(kinds.skipped).toBeLessThan(15);
  });

  it("ships categorized Tatoeba phrases", () => {
    for (const phrase of phrases) {
      expect(phrase.es.length).toBeGreaterThan(0);
      expect(phrase.en.length).toBeGreaterThan(0);
      expect(phrase.category.length).toBeGreaterThan(0);
      expect(phrase.tatoeba).toBeGreaterThan(0);
    }
  });
});
