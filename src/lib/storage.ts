import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { localDate, shiftDate } from "./dates.ts";
import { type CardState } from "./srs.ts";
import {
  defaultFilters,
  defaultMeta,
  defaultSettings,
  type Filters,
  type MetaState,
  type Settings,
} from "./types.ts";
import type { Rating } from "./srs.ts";

export interface ReviewEvent {
  id?: number;
  cardId: string;
  ts: number;
  rating: Rating;
  mode: string;
  correct: boolean;
}

interface RaizDB extends DBSchema {
  cards: { key: string; value: CardState };
  reviews: { key: number; value: ReviewEvent; indexes: { "by-ts": number } };
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  settings: Settings;
  filters: Filters;
  meta: MetaState;
  cards: CardState[];
  reviews: ReviewEvent[];
}

const SETTINGS_KEY = "raiz.settings";
const FILTERS_KEY = "raiz.filters";
const META_KEY = "raiz.meta";

let database: Promise<IDBPDatabase<RaizDB>> | null = null;

function db(): Promise<IDBPDatabase<RaizDB>> {
  if (!database) {
    database = openDB<RaizDB>("raiz", 1, {
      upgrade(store) {
        store.createObjectStore("cards", { keyPath: "id" });
        const reviews = store.createObjectStore("reviews", { keyPath: "id", autoIncrement: true });
        reviews.createIndex("by-ts", "ts");
      },
    });
  }
  return database;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function loadSettings(): Settings {
  return readJson(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadFilters(): Filters {
  return readJson(FILTERS_KEY, defaultFilters);
}

export function saveFilters(filters: Filters): void {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function loadMeta(): MetaState {
  const today = localDate();
  const meta = readJson(META_KEY, defaultMeta());
  return {
    ...meta,
    reviewsToday: meta.reviewsTodayDate === today ? meta.reviewsToday : 0,
    reviewsTodayDate: today,
    newToday: meta.newTodayDate === today ? meta.newToday : 0,
    newTodayDate: today,
  };
}

export function saveMeta(meta: MetaState): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export async function allCards(): Promise<CardState[]> {
  return (await db()).getAll("cards");
}

export async function putCard(card: CardState): Promise<void> {
  await (await db()).put("cards", card);
}

export async function reviewsSince(since: number): Promise<ReviewEvent[]> {
  return (await db()).getAllFromIndex("reviews", "by-ts", IDBKeyRange.lowerBound(since));
}

export async function addReview(event: ReviewEvent): Promise<void> {
  const { id: _id, ...rest } = event;
  await (await db()).add("reviews", rest as ReviewEvent);
}

export function noteReview(meta: MetaState, introducedNew: boolean, goal: number, now = new Date()): MetaState {
  const today = localDate(now);
  const reviewsToday = (meta.reviewsTodayDate === today ? meta.reviewsToday : 0) + 1;
  const newToday = (meta.newTodayDate === today ? meta.newToday : 0) + (introducedNew ? 1 : 0);
  let { streak, lastStreakDate } = meta;
  if (reviewsToday >= goal && lastStreakDate !== today) {
    streak = lastStreakDate === shiftDate(today, -1) ? streak + 1 : 1;
    lastStreakDate = today;
  }
  return { streak, lastStreakDate, reviewsToday, reviewsTodayDate: today, newToday, newTodayDate: today };
}

export async function exportBackup(): Promise<BackupFile> {
  const database = await db();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    filters: loadFilters(),
    meta: loadMeta(),
    cards: await database.getAll("cards"),
    reviews: await database.getAll("reviews"),
  };
}

export async function importBackup(file: BackupFile, mode: "replace" | "merge"): Promise<void> {
  if (file.version !== 1 || !Array.isArray(file.cards)) throw new Error("That file is not a Raíz backup.");
  const database = await db();
  const tx = database.transaction(["cards", "reviews"], "readwrite");
  if (mode === "replace") {
    await tx.objectStore("cards").clear();
    await tx.objectStore("reviews").clear();
    for (const card of file.cards) await tx.objectStore("cards").put(card);
    for (const review of file.reviews ?? []) {
      const { id: _id, ...rest } = review;
      await tx.objectStore("reviews").add(rest as ReviewEvent);
    }
  } else {
    for (const card of file.cards) {
      const current = await tx.objectStore("cards").get(card.id);
      if (!current || (card.lastReview ?? 0) >= (current.lastReview ?? 0)) {
        await tx.objectStore("cards").put({ ...card, starred: card.starred || current?.starred || false });
      } else if (card.starred && !current.starred) {
        await tx.objectStore("cards").put({ ...current, starred: true });
      }
    }
    for (const review of file.reviews ?? []) {
      const { id: _id, ...rest } = review;
      await tx.objectStore("reviews").add(rest as ReviewEvent);
    }
  }
  await tx.done;
  if (file.settings) saveSettings({ ...defaultSettings, ...file.settings });
  if (file.filters) saveFilters({ ...defaultFilters, ...file.filters });
  if (file.meta && mode === "replace") saveMeta({ ...defaultMeta(), ...file.meta });
}
