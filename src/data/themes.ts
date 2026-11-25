import { HOME_THEMES } from "./themes-home.ts";
import { LIFE_THEMES } from "./themes-life.ts";
import { OUT_THEMES } from "./themes-out.ts";
import { WORK_THEMES } from "./themes-work.ts";
import type { Theme, ThemeItem } from "./theme-types.ts";

export type { Theme, ThemeItem };

export const THEMES: Theme[] = [...HOME_THEMES, ...OUT_THEMES, ...LIFE_THEMES, ...WORK_THEMES];

export const THEME_GROUPS = [...new Set(THEMES.map((theme) => theme.group))];

export function themeById(id: string): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}

export function themeSlug(item: ThemeItem): string {
  const source = `${item.article ?? ""}-${item.lemma ?? item.es}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return source.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export function themeCardId(themeId: string, item: ThemeItem): string {
  return `theme:${themeId}:${themeSlug(item)}`;
}
