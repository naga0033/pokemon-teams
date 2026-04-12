// 構築記事検索ページ (白地版)
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { TrainerCard } from "@/components/TrainerCard";
import { Pagination } from "@/components/Pagination";
import {
  getSuggestedPokemonNames,
  paginateTeams,
  searchTeams,
  sortTeams,
} from "@/lib/search";
import { loadSavedTeams } from "@/lib/saved-teams";
import type { Format } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    format?: string;
    pokemon?: string | string[];
    page?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const savedTeams = await loadSavedTeams();

  const format: Format = sp.format === "double" ? "double" : "single";
  const pokemons = Array.isArray(sp.pokemon)
    ? sp.pokemon
    : sp.pokemon
      ? [sp.pokemon]
      : [];
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;

  const allMatched = sortTeams(searchTeams({ format, pokemons }, savedTeams));
  const suggestions = getSuggestedPokemonNames(
    searchTeams({ format }, savedTeams),
    pokemons,
    8,
  );
  const { items, total, page: currentPage, totalPages } = paginateTeams(allMatched, page);

  const currentQuery = new URLSearchParams();
  currentQuery.set("format", format);
  for (const p of pokemons) currentQuery.append("pokemon", p);

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
        <Link href="/" className="hover:text-cyan-600">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-slate-700">構築検索</span>
      </div>

      {/* 検索フィルタ (上部 sticky) */}
      <SearchFilters
        initialFormat={format}
        initialPokemons={pokemons}
        suggestions={suggestions}
        sticky={false}
      />

      {/* 検索結果件数 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">
            検索結果
          </span>
          <span className="font-display text-2xl font-black text-slate-900">
            {total}
            <span className="ml-1 text-sm text-slate-400">件</span>
          </span>
        </div>
        <span className="text-[11px] tracking-wide text-slate-400">
          {format === "single" ? "シングル" : "ダブル"}
          {pokemons.length > 0 && ` · ${pokemons.join(" + ")}`}
        </span>
      </div>

      {/* カードグリッド */}
      {items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((team, i) => (
            <TrainerCard key={team.id} team={team} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-16 text-center">
          <p className="text-sm font-bold tracking-wide text-slate-500">
            条件に合う構築が見つかりませんでした
          </p>
          <p className="mt-2 text-xs text-slate-400">
            条件にマッチする構築が見つかりませんでした。フィルタを変えて試してみてください。
          </p>
        </div>
      )}

      {/* ページング */}
      <Pagination currentPage={currentPage} totalPages={totalPages} query={currentQuery} />
    </div>
  );
}
