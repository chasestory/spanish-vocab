import { describe, expect, it } from "vitest";
import { GRAMMAR } from "../data/grammar.ts";
import { PREPOSITIONS } from "../data/prepositions.ts";
import { PRONOUN_EXERCISES } from "../data/pronouns.ts";
import { THEMES } from "../data/themes.ts";
import { checkNormalized } from "./answer.ts";
import { newCard } from "./srs.ts";
import { encodeSync, decodeSync, previewMerge } from "./sync.ts";
import { defaultFilters, defaultMeta, defaultSettings } from "./types.ts";

describe("new study content", () => {
  it("ships 100 verb-preposition entries, including the meaning splits", () => {
    expect(PREPOSITIONS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PREPOSITIONS.map((entry) => entry.id)).size).toBe(PREPOSITIONS.length);
    const pair = (verb: string, prep: string) => PREPOSITIONS.find((entry) => entry.verb === verb && entry.prep === prep);
    expect(pair("pensar", "en")?.example.toLowerCase()).toContain("pienso en");
    expect(pair("pensar", "de")?.contrast).toMatch(/pensar en/i);
    expect(pair("depender", "de")).toBeTruthy();
    expect(pair("soñar", "con")).toBeTruthy();
    expect(pair("empezar", "a")).toBeTruthy();
    expect(pair("tratar", "de")).toBeTruthy();
    expect(pair("enamorarse", "de")).toBeTruthy();
    expect(pair("casarse", "con")).toBeTruthy();
    expect(pair("acordarse", "de")).toBeTruthy();
    expect(pair("consistir", "en")).toBeTruthy();
    expect(pair("insistir", "en")).toBeTruthy();
    expect(pair("ayudar", "a")).toBeTruthy();
    expect(pair("dejar", "de")).toBeTruthy();
    expect(pair("contar", "con")).toBeTruthy();
    for (const entry of PREPOSITIONS) {
      expect(entry.prep.length).toBeGreaterThan(0);
      expect(entry.example.length).toBeGreaterThan(8);
      expect(entry.exampleEn.length).toBeGreaterThan(4);
    }
  });

  it("ships 80 pronoun exercises and accepts both clitic positions", () => {
    expect(PRONOUN_EXERCISES.length).toBeGreaterThanOrEqual(80);
    const give = PRONOUN_EXERCISES.find((item) => item.answers.includes("Se lo doy") && item.prompt.includes("María"));
    expect(give).toBeTruthy();
    expect(checkNormalized("se lo doy.", give!.answers).result).toBe("correct");
    expect(checkNormalized("LE LO DOY", give!.answers).result).toBe("wrong");
    const trip = PRONOUN_EXERCISES.find((item) => item.answers.includes("Voy a dárselo"));
    expect(trip?.answers).toContain("Se lo voy a dar");
    expect(checkNormalized("Voy a dárselo", trip!.answers).result).toBe("correct");
    expect(checkNormalized("se lo voy a dar!", trip!.answers).result).toBe("correct");
    expect(checkNormalized("Yo se lo voy a dar", trip!.answers).result).toBe("correct");
    expect(checkNormalized("voy a darselo", trip!.answers).result).toBe("accent");
    const see = PRONOUN_EXERCISES.find((item) => item.answers.includes("La veo"));
    expect(checkNormalized("veo", see!.answers).result).toBe("wrong");
    expect(checkNormalized("LA VEO", see!.answers).result).toBe("correct");
  });

  it("keeps every theme in range and the grammar lessons present", () => {
    const ids = [
      "home-rooms", "home-kitchen", "home-chores", "outdoors-nature", "outdoors-mountains",
      "outdoors-beach", "outdoors-weather", "town-city", "food-grocery", "food-restaurant",
      "people-clothing", "people-body", "people-health", "people-family", "people-emotions",
      "people-animals", "work-jobs", "work-tools", "work-construction", "work-school",
      "travel-car", "travel-airport",
    ];
    for (const id of ids) {
      const theme = THEMES.find((item) => item.id === id);
      expect(theme, id).toBeTruthy();
      expect(theme!.items.length).toBeGreaterThanOrEqual(25);
      expect(theme!.items.length).toBeLessThanOrEqual(60);
      for (const item of theme!.items) {
        expect(item.en.length).toBeGreaterThan(0);
        expect(item.example.length).toBeGreaterThan(0);
        expect(item.exampleEn.length).toBeGreaterThan(0);
      }
    }
    const lessons = new Set(GRAMMAR.map((lesson) => lesson.id));
    for (const id of ["ser-estar", "por-para", "preterite-imperfect", "subjunctive", "gustar", "reflexive", "comparatives"]) {
      expect(lessons.has(id)).toBe(true);
    }
    const agua = THEMES.flatMap((theme) => theme.items).find((item) => item.lemma === "agua");
    expect(agua?.gender).toBe("f");
    expect(agua?.article).toBe("el");
    const mano = THEMES.flatMap((theme) => theme.items).find((item) => item.lemma === "mano");
    expect(mano?.gender).toBe("f");
    expect(mano?.article).toBe("la");
  });

  it("round-trips a sync code and merges the newer review", async () => {
    const localCard = { ...newCard("casa", 1), lastReview: 10, starred: false, interval: 3 };
    const incomingCard = { ...newCard("casa", 1), lastReview: 20, starred: true, interval: 8 };
    const other = { ...newCard("ser", 1), lastReview: 5, starred: true };
    const local = {
      version: 1 as const,
      exportedAt: "2026-01-01",
      settings: defaultSettings,
      filters: defaultFilters,
      meta: { ...defaultMeta(), streak: 4, lastStreakDate: "2026-01-01" },
      cards: [localCard],
      reviews: [],
      activity: { "2026-01-01": { reviews: 2, correct: 1 } },
    };
    const incoming = {
      ...local,
      meta: { ...defaultMeta(), streak: 2, lastStreakDate: "2025-12-01" },
      cards: [incomingCard, other],
      activity: { "2026-01-01": { reviews: 1, correct: 1 }, "2026-01-02": { reviews: 3, correct: 3 } },
    };
    const code = await encodeSync(incoming);
    expect(code.startsWith("raiz1.")).toBe(true);
    const decoded = await decodeSync(code);
    const { preview, merged } = previewMerge(local, decoded);
    expect(preview.streak).toBe(4);
    expect(preview.newStars).toBe(2);
    expect(merged.cards.find((card) => card.id === "casa")?.interval).toBe(8);
    expect(merged.cards.find((card) => card.id === "casa")?.starred).toBe(true);
    expect(merged.cards.some((card) => card.id === "ser")).toBe(true);
    expect(merged.settings).toEqual(local.settings);
    expect(merged.activity?.["2026-01-01"]?.reviews).toBe(2);
    expect(merged.activity?.["2026-01-02"]?.reviews).toBe(3);
  });
});
