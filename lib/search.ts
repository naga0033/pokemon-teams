// 検索ロジック: 形式・ポケモン名でダミーデータを絞り込む
import { DUMMY_TEAMS } from "./dummy-teams";
import { normalizeJaText } from "./japanese-match";
import type { SearchParams, Team } from "./types";

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

/** 順位 → レート順に並べ替え */
export function sortTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (a.rank != null && b.rank != null) return a.rank - b.rank;
    if (a.rank != null) return -1;
    if (b.rank != null) return 1;
    return (b.rating ?? 0) - (a.rating ?? 0);
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
