import { describe, expect, it } from "vitest";
import { attachClitic, conjugate, displayForm } from "./conjugate.ts";
import { adjectiveForms, nounForms, pluralize } from "./morphology.ts";

describe("reflexive commands and plurals", () => {
  it("attaches pronouns to affirmative commands", () => {
    expect(attachClitic("lava", "te")).toBe("lávate");
    expect(attachClitic("hable", "se")).toBe("háblese");
    expect(attachClitic("lavemos", "nos")).toBe("lavémonos");
    expect(attachClitic("lavad", "os")).toBe("lavaos");
    expect(attachClitic("hablen", "se")).toBe("háblense");
    expect(attachClitic("sienta", "te")).toBe("siéntate");
    expect(attachClitic("acueste", "se")).toBe("acuéstese");
    expect(attachClitic("ve", "te")).toBe("vete");
    expect(attachClitic("pon", "te")).toBe("ponte");
    expect(attachClitic("viste", "te")).toBe("vístete");
    expect(attachClitic("despierta", "te")).toBe("despiértate");
    const lavar = conjugate("lavarse");
    expect(displayForm(lavar!, "present", "yo")).toBe("me lavo");
    expect(displayForm(lavar!, "imperative", "tu")).toBe("lávate");
    expect(displayForm(lavar!, "imperative", "nosotros")).toBe("lavémonos");
    expect(displayForm(lavar!, "imperativeNegative", "tu")).toBe("no te laves");
    expect(displayForm(lavar!, "presentPerfect", "yo")).toBe("me he lavado");
    expect(displayForm(conjugate("irse")!, "imperative", "tu")).toBe("vete");
    expect(displayForm(conjugate("irse")!, "imperative", "nosotros")).toBe("vámonos");
    expect(displayForm(conjugate("irse")!, "imperative", "el")).toBe("váyase");
    expect(displayForm(conjugate("ponerse")!, "imperative", "tu")).toBe("ponte");
  });

  it("pluralizes nouns and inflects adjectives", () => {
    expect(pluralize("casa")).toBe("casas");
    expect(pluralize("mujer")).toBe("mujeres");
    expect(pluralize("lápiz")).toBe("lápices");
    expect(pluralize("luz")).toBe("luces");
    expect(pluralize("joven")).toBe("jóvenes");
    expect(pluralize("nación")).toBe("naciones");
    expect(pluralize("país")).toBe("países");
    expect(pluralize("café")).toBe("cafés");
    expect(pluralize("rey")).toBe("reyes");
    expect(pluralize("examen")).toBe("exámenes");
    expect(pluralize("inglés")).toBe("ingleses");
    expect(pluralize("día")).toBe("días");
    expect(pluralize("problema")).toBe("problemas");
    const agua = nounForms({ lemma: "agua", gender: "f", article: "el" });
    expect(agua.indefinite).toBe("un");
    expect(agua.pluralArticle).toBe("las");
    expect(agua.note).toMatch(/Feminine/);
    const estudiante = nounForms({ lemma: "estudiante", gender: "mf", article: "el/la" });
    expect(estudiante.indefinite).toBe("un/una");
    expect(estudiante.pluralArticle).toBe("los/las");
    expect(adjectiveForms("bueno")).toEqual({ masculine: "bueno", feminine: "buena", masculinePlural: "buenos", femininePlural: "buenas" });
    expect(adjectiveForms("fácil").masculinePlural).toBe("fáciles");
    expect(adjectiveForms("feliz").femininePlural).toBe("felices");
    expect(adjectiveForms("inglés").feminine).toBe("inglesa");
    expect(adjectiveForms("trabajador").feminine).toBe("trabajadora");
    expect(adjectiveForms("mejor").feminine).toBe("mejor");
    expect(adjectiveForms("gran").note).toMatch(/grande/);
  });
});
