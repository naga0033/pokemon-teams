// 検索ロジック: 形式・ポケモン名で構築を絞り込む
import { DUMMY_TEAMS } from "./dummy-teams";
import { normalizeJaText } from "./japanese-match";
import type { SearchParams, Team, TeamSort } from "./types";

/** 1 ページあたりの件数 */
export const PAGE_SIZE = 10;

/**
 * 構築を検索する
 * - format: シングル / ダブル フィルタ
 * - pokemons: 指定した全てを含むパーティのみ (AND)
 *   - マッチは正規化後の部分一致 (カナ/かな/半角全角を吸収)
 */
export function searchTeams(params: SearchParams, extraTeams: Team[] = []): Team[] {
  const allTeams = [...extraTeams, ...DUMMY_TEAMS];
  const normalizedTargets = (params.pokemons ?? [])
    .map((p) => normalizeJaText(p))
    .filter((p) => p.length > 0);

  return allTeams.filter((team) => {
    if (params.format && team.format !== params.format) return false;

    if (normalizedTargets.length > 0) {
      const normalizedTeamNames = team.pokemons.map((p) => normalizeJaText(p.name));
      const allMatch = normalizedTargets.every((target) =>
        normalizedTeamNames.some((tn) => tn.includes(target)),
      );
      if (!allMatch) return false;
    }

    return true;
  });
}

/** 指定した基準で並べ替え */
export function sortTeams(teams: Team[], sort: TeamSort = "newest"): Team[] {
  return [...teams].sort((a, b) => {
    if (sort === "views") {
      if ((a.viewCount ?? 0) !== (b.viewCount ?? 0)) {
        return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      }
      return b.registeredAt.localeCompare(a.registeredAt);
    }

    if (sort === "rating") {
      // レートなし (undefined) は一番下に。レート降順。
      const aHas = typeof a.rating === "number";
      const bHas = typeof b.rating === "number";
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      if (aHas && bHas && a.rating !== b.rating) {
        return (b.rating as number) - (a.rating as number);
      }
      return b.registeredAt.localeCompare(a.registeredAt);
    }

    if (sort === "oldest") {
      return a.registeredAt.localeCompare(b.registeredAt);
    }

    return b.registeredAt.localeCompare(a.registeredAt);
  });
}

/** 検索結果をページングする */
export function paginateTeams(
  teams: Team[],
  page: number,
): { items: Team[]; total: number; page: number; totalPages: number } {
  const total = teams.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;
  return {
    items: teams.slice(start, start + PAGE_SIZE),
    total,
    page: current,
    totalPages,
  };
}

/** 検索補助用に、よく使われているポケモン名を返す */
export function getSuggestedPokemonNames(
  teams: Team[],
  selected: string[] = [],
  limit = 6,
): string[] {
  const selectedSet = new Set(selected.map((name) => normalizeJaText(name)));
  const counts = new Map<string, number>();

  for (const team of teams) {
    for (const pokemon of team.pokemons) {
      const normalized = normalizeJaText(pokemon.name);
      if (selectedSet.has(normalized)) continue;
      counts.set(pokemon.name, (counts.get(pokemon.name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], "ja");
    })
    .slice(0, limit)
    .map(([name]) => name);
}
