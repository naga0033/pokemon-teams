// 構築記事検索ページ (白地版)
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { TrainerCard } from "@/components/TrainerCard";
import { Pagination } from "@/components/Pagination";
import {
  paginateTeams,
  searchTeams,
  sortTeams,
} from "@/lib/search";
import { loadSavedTeams } from "@/lib/saved-teams";
import type { Format, TeamSort } from "@/lib/types";
import { getUsageSuggestNames } from "@/lib/usage-ranking";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    format?: string;
    pokemon?: string | string[];
    sort?: string;
    page?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const savedTeams = await loadSavedTeams();

  // format=all または未指定 → シングル/ダブル両方を表示
  const isAll = sp.format === "all" || !sp.format;
  const format: Format | undefined = isAll
    ? undefined
    : sp.format === "double"
      ? "double"
      : "single";
  const pokemons = Array.isArray(sp.pokemon)
    ? sp.pokemon
    : sp.pokemon
      ? [sp.pokemon]
      : [];
  const sort: TeamSort = sp.sort === "views" || sp.sort === "oldest" ? sp.sort : "newest";
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;

  const allMatched = sortTeams(searchTeams({ format, pokemons }, savedTeams), sort);
  const suggestions = getUsageSuggestNames(format ?? "single", pokemons, 8);
  const { items, total, page: currentPage, totalPages } = paginateTeams(allMatched, page);

  const currentQuery = new URLSearchParams();
  currentQuery.set("format", isAll ? "all" : format!);
  currentQuery.set("sort", sort);
  for (const p of pokemons) currentQuery.append("pokemon", p);

  return (
    <div className="space-y-6">
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
          {isAll ? "すべて (シングル + ダブル)" : format === "single" ? "シングル" : "ダブル"}
          {pokemons.length > 0 && ` · ${pokemons.join(" + ")}`}
          {` · ${sort === "newest" ? "新しい順" : sort === "views" ? "閲覧順" : "古い順"}`}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
          SORT
        </span>
        <div className="inline-flex w-full rounded-full border border-slate-200 bg-white p-1 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.35)] sm:w-auto">
          {(
            [
              { value: "newest", label: "新しい順" },
              { value: "views", label: "閲覧順" },
              { value: "oldest", label: "古い順" },
            ] as const
          ).map((option) => {
            const next = new URLSearchParams(currentQuery);
            next.set("sort", option.value);
            next.delete("page");

            const active = sort === option.value;

            return (
              <Link
                key={option.value}
                href={`/search?${next.toString()}`}
                className={
                  active
                    ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.6)]"
                    : "rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {option.label}
              </Link>
            );
          })}
        </div>
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
