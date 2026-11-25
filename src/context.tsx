import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadCorpus, type Corpus } from "./lib/corpus.ts";
import { visibleStreak } from "./lib/dates.ts";
import type { CardState } from "./lib/srs.ts";
import { newCard, reviewCard, type Rating } from "./lib/srs.ts";
import {
  addReview,
  allCards,
  bumpActivity,
  loadActivity,
  loadFilters,
  loadMeta,
  loadSettings,
  noteReview,
  putCard,
  reviewsSince,
  saveFilters,
  saveMeta,
  saveSettings,
  type DayActivity,
  type ReviewEvent,
} from "./lib/storage.ts";
import type { Filters, MetaState, Settings } from "./lib/types.ts";

interface AppState {
  corpus: Corpus;
  cards: Map<string, CardState>;
  reviews: ReviewEvent[];
  settings: Settings;
  filters: Filters;
  meta: MetaState;
  activity: Record<string, DayActivity>;
  setSettings: (next: Settings) => void;
  setFilters: (next: Filters) => void;
  grade: (id: string, rating: Rating, mode: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp outside provider");
  return value;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Map<string, CardState>>(new Map());
  const [reviews, setReviews] = useState<ReviewEvent[]>([]);
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const [filters, setFiltersState] = useState<Filters>(() => loadFilters());
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [activity, setActivity] = useState<Record<string, DayActivity>>(() => loadActivity());

  const reload = useCallback(async () => {
    const [loaded, stored, recent] = await Promise.all([
      loadCorpus(),
      allCards(),
      reviewsSince(Date.now() - 180 * 86_400_000),
    ]);
    setCorpus(loaded);
    setCards(new Map(stored.map((card) => [card.id, card])));
    setReviews(recent);
    setMeta(loadMeta());
    setActivity(loadActivity());
  }, []);

  useEffect(() => {
    let cancel = false;
    reload().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "Could not open the deck.");
    });
    return () => {
      cancel = true;
    };
  }, [reload]);

  useEffect(() => {
    const root = document.documentElement;
    const dark =
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", dark);
    root.classList.toggle("large", settings.textSize === "large");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (settings.theme === "system") root.classList.toggle("dark", media.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme, settings.textSize]);

  const setSettings = useCallback((next: Settings) => {
    setSettingsState(next);
    saveSettings(next);
  }, []);

  const setFilters = useCallback((next: Filters) => {
    setFiltersState(next);
    saveFilters(next);
  }, []);

  const grade = useCallback(
    async (id: string, rating: Rating, mode: string) => {
      const now = Date.now();
      const current = cards.get(id) ?? newCard(id, now);
      const next = reviewCard(current, rating, now);
      next.starred = current.starred;
      await putCard(next);
      const event: ReviewEvent = {
        cardId: id,
        ts: now,
        rating,
        mode,
        correct: rating !== "again",
      };
      await addReview(event);
      const metaNext = noteReview(meta, current.status === "new", settings.dailyGoal, new Date(now));
      saveMeta(metaNext);
      setMeta(metaNext);
      setActivity(bumpActivity(rating !== "again", new Date(now)));
      setCards((prev) => new Map(prev).set(id, next));
      setReviews((prev) => [...prev, event]);
    },
    [cards, meta, settings.dailyGoal],
  );

  const toggleStar = useCallback(
    async (id: string) => {
      const now = Date.now();
      const current = cards.get(id) ?? newCard(id, now);
      const next = { ...current, starred: !current.starred };
      await putCard(next);
      setCards((prev) => new Map(prev).set(id, next));
    },
    [cards],
  );

  const value = useMemo(() => {
    if (!corpus) return null;
    return { corpus, cards, reviews, settings, filters, meta, activity, setSettings, setFilters, grade, toggleStar, reload };
  }, [corpus, cards, reviews, settings, filters, meta, activity, setSettings, setFilters, grade, toggleStar, reload]);

  if (error) {
    return (
      <div className="boot">
        <h1>Raíz couldn’t open the deck.</h1>
        <p>{error}</p>
        <button className="btn primary" type="button" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="boot">
        <p className="eyebrow">Raíz</p>
        <h1>Opening the deck…</h1>
      </div>
    );
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function streakNow(meta: MetaState): number {
  return visibleStreak(meta.streak, meta.lastStreakDate);
}
