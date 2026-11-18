import { describe, expect, it } from "vitest";
import { checkAnswer } from "./answer.ts";

describe("answer checking", () => {
  it("accepts case, punctuation, and articles", () => {
    expect(checkAnswer("  Café! ", ["café"]).result).toBe("correct");
    expect(checkAnswer("la casa", ["casa"]).result).toBe("correct");
    expect(checkAnswer("casa", ["la casa"]).result).toBe("correct");
    expect(checkAnswer("EL AGUA", ["agua"]).result).toBe("correct");
  });

  it("flags a missing accent and suggests the written form", () => {
    const result = checkAnswer("cafe", ["café"]);
    expect(result.result).toBe("accent");
    expect(result.suggestion).toBe("café");
    expect(checkAnswer("como", ["cómo"]).suggestion).toBe("cómo");
  });

  it("accepts any gloss and a verb without 'to'", () => {
    expect(checkAnswer("house", ["house; home"]).result).toBe("correct");
    expect(checkAnswer("home", ["house; home"]).result).toBe("correct");
    expect(checkAnswer("speak", ["to speak; to talk"]).result).toBe("correct");
    expect(checkAnswer("building", ["house (a building)"])).toBeTruthy();
    expect(checkAnswer("building", ["house (a building)"]).result).toBe("wrong");
  });

  it("rejects a different word", () => {
    expect(checkAnswer("perro", ["casa"]).result).toBe("wrong");
    expect(checkAnswer("", ["ser"]).result).toBe("wrong");
  });

  it("checks conjugated forms with accent tolerance", () => {
    expect(checkAnswer("tuve", ["tuve"]).result).toBe("correct");
    expect(checkAnswer("estive", ["estuve"]).result).toBe("wrong");
    expect(checkAnswer("se", ["sé"]).result).toBe("accent");
  });
});
