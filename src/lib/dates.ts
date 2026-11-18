export function localDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export function visibleStreak(streak: number, last: string | null, today = localDate()): number {
  if (!last || streak <= 0) return 0;
  if (last === today || last === shiftDate(today, -1)) return streak;
  return 0;
}
