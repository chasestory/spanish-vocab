import type { CardState } from "./srs.ts";
import type { BackupFile } from "./storage.ts";
import type { MetaState } from "./types.ts";

const PREFIX = "raiz1.";

export interface MergePreview {
  incomingCards: number;
  added: number;
  updated: number;
  newStars: number;
  localStreak: number;
  incomingStreak: number;
  streak: number;
}

function bytesToString(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return binary;
}

function stringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) bytes[i] = value.charCodeAt(i);
  return bytes;
}

function base64url(bytes: Uint8Array): string {
  return btoa(bytesToString(bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return stringToBytes(atob(padded));
}

export async function encodeSync(file: BackupFile): Promise<string> {
  const stream = new Blob([JSON.stringify(file)]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return PREFIX + base64url(bytes);
}

export async function decodeSync(raw: string): Promise<BackupFile> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as BackupFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.cards)) throw new Error("That file is not a Raíz backup.");
    return parsed;
  }
  const compact = trimmed.replace(/\s+/g, "");
  if (!compact.startsWith(PREFIX)) throw new Error("That is not a Raíz sync code.");
  const bytes = fromBase64url(compact.slice(PREFIX.length));
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream("gzip"));
  const parsed = JSON.parse(await new Response(stream).text()) as BackupFile;
  if (parsed.version !== 1 || !Array.isArray(parsed.cards)) throw new Error("That code is not a Raíz backup.");
  return parsed;
}

function laterDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export function mergeCards(local: CardState[], incoming: CardState[]): CardState[] {
  const map = new Map<string, CardState>();
  for (const card of [...local, ...incoming]) {
    const current = map.get(card.id);
    if (!current) {
      map.set(card.id, card);
      continue;
    }
    const newer = (card.lastReview ?? 0) >= (current.lastReview ?? 0) ? card : current;
    const older = newer === card ? current : card;
    map.set(card.id, { ...newer, starred: Boolean(newer.starred || older.starred) });
  }
  return [...map.values()];
}

export function mergeMeta(local: MetaState, incoming: MetaState | undefined): MetaState {
  if (!incoming) return local;
  const streak = Math.max(local.streak, incoming.streak ?? 0);
  const last = incoming.streak > local.streak
    ? incoming.lastStreakDate
    : incoming.streak < local.streak
      ? local.lastStreakDate
      : laterDate(local.lastStreakDate, incoming.lastStreakDate);
  return { ...local, streak, lastStreakDate: last };
}

export function mergeActivity(
  local: BackupFile["activity"],
  incoming: BackupFile["activity"],
): NonNullable<BackupFile["activity"]> {
  const out: NonNullable<BackupFile["activity"]> = { ...(local ?? {}) };
  for (const [day, stat] of Object.entries(incoming ?? {})) {
    const prev = out[day];
    out[day] = prev
      ? { reviews: Math.max(prev.reviews, stat.reviews), correct: Math.max(prev.correct, stat.correct) }
      : stat;
  }
  return out;
}

export function previewMerge(local: BackupFile, incoming: BackupFile): { preview: MergePreview; merged: BackupFile } {
  const cards = mergeCards(local.cards, incoming.cards);
  const localIds = new Set(local.cards.map((card) => card.id));
  let updated = 0;
  let newStars = 0;
  const localById = new Map(local.cards.map((card) => [card.id, card]));
  for (const card of cards) {
    const before = localById.get(card.id);
    if (!before) continue;
    if ((card.lastReview ?? 0) > (before.lastReview ?? 0)) updated += 1;
    if (card.starred && !before.starred) newStars += 1;
  }
  for (const card of incoming.cards) {
    if (!localIds.has(card.id) && card.starred) newStars += 1;
  }
  const meta = mergeMeta(local.meta, incoming.meta);
  const preview: MergePreview = {
    incomingCards: incoming.cards.length,
    added: cards.length - local.cards.length,
    updated,
    newStars,
    localStreak: local.meta.streak,
    incomingStreak: incoming.meta?.streak ?? 0,
    streak: meta.streak,
  };
  const seen = new Set<string>();
  const reviews = [...local.reviews, ...(incoming.reviews ?? [])].filter((review) => {
    const key = `${review.cardId}|${review.ts}|${review.rating}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    preview,
    merged: {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: local.settings,
      filters: local.filters,
      meta,
      cards,
      reviews,
      activity: mergeActivity(local.activity, incoming.activity),
    },
  };
}
