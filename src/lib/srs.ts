export type Rating = "again" | "hard" | "good" | "easy";

export interface CardState {
  id: string;
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  due: number;
  lastReview: number | null;
  status: "new" | "learning" | "review";
  starred: boolean;
}

const DAY = 86_400_000;
const MINUTE = 60_000;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function newCard(id: string, now = Date.now()): CardState {
  return {
    id,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    due: now,
    lastReview: null,
    status: "new",
    starred: false,
  };
}

/** SM-2 variant. Again = fail, Hard = remembered with trouble, Good = standard, Easy = bonus. */
export function reviewCard(card: CardState, rating: Rating, now: number): CardState {
  let { ease, interval, repetitions, lapses, status } = card;
  if (rating === "again") {
    if (status !== "new") lapses += 1;
    return {
      ...card,
      ease: Math.max(1.3, round2(ease - 0.2)),
      interval: 0,
      repetitions: 0,
      lapses,
      status: "learning",
      due: now + 10 * MINUTE,
      lastReview: now,
    };
  }
  if (rating === "hard") {
    ease = Math.max(1.3, round2(ease - 0.15));
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    return {
      ...card,
      ease,
      interval,
      repetitions: Math.max(1, repetitions),
      lapses,
      status: "review",
      due: now + interval * DAY,
      lastReview: now,
    };
  }
  if (rating === "good") {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    return {
      ...card,
      ease,
      interval,
      repetitions: repetitions + 1,
      lapses,
      status: "review",
      due: now + interval * DAY,
      lastReview: now,
    };
  }
  ease = round2(ease + 0.15);
  interval = repetitions === 0 ? 4 : Math.max(1, Math.round(interval * ease * 1.3));
  return {
    ...card,
    ease,
    interval,
    repetitions: repetitions + 1,
    lapses,
    status: "review",
    due: now + interval * DAY,
    lastReview: now,
  };
}

export function isLearned(card: CardState | undefined): boolean {
  return !!card && card.interval >= 21;
}

export function countsAsCorrect(rating: Rating): boolean {
  return rating !== "again";
}
