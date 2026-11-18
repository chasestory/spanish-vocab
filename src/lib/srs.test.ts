import { describe, expect, it } from "vitest";
import { isLearned, newCard, reviewCard } from "./srs.ts";

const NOW = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

describe("SM-2 scheduler", () => {
  it("schedules good answers on the classic 1, 6, ease steps", () => {
    let card = newCard("hablar", NOW);
    card = reviewCard(card, "good", NOW);
    expect(card.interval).toBe(1);
    expect(card.repetitions).toBe(1);
    expect(card.due).toBe(NOW + DAY);
    card = reviewCard(card, "good", card.due);
    expect(card.interval).toBe(6);
    expect(card.repetitions).toBe(2);
    card = reviewCard(card, "good", card.due);
    expect(card.interval).toBe(15);
    expect(card.ease).toBe(2.5);
    expect(card.status).toBe("review");
  });

  it("resets on again and shortens ease", () => {
    let card = reviewCard(newCard("ser", NOW), "good", NOW);
    card = reviewCard(card, "good", card.due);
    card = reviewCard(card, "again", card.due);
    expect(card.repetitions).toBe(0);
    expect(card.interval).toBe(0);
    expect(card.lapses).toBe(1);
    expect(card.ease).toBe(2.3);
    expect(card.status).toBe("learning");
    expect(card.due).toBe(card.lastReview! + 10 * 60_000);
  });

  it("does not count a lapse the first time a new card is missed", () => {
    const card = reviewCard(newCard("ir", NOW), "again", NOW);
    expect(card.lapses).toBe(0);
    expect(card.ease).toBe(2.3);
  });

  it("handles hard and easy", () => {
    const hard = reviewCard(newCard("dar", NOW), "hard", NOW);
    expect(hard.interval).toBe(1);
    expect(hard.ease).toBe(2.35);
    expect(hard.repetitions).toBe(1);
    const easy = reviewCard(newCard("ver", NOW), "easy", NOW);
    expect(easy.interval).toBe(4);
    expect(easy.ease).toBe(2.65);
    const again = reviewCard(easy, "hard", easy.due);
    expect(again.interval).toBe(Math.max(1, Math.round(4 * 1.2)));
  });

  it("marks a card learned at a 21-day interval", () => {
    let card = newCard("poner", NOW);
    expect(isLearned(card)).toBe(false);
    card = { ...card, interval: 21, status: "review" };
    expect(isLearned(card)).toBe(true);
  });
});
