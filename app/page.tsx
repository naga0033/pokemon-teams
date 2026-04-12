// ホームページ: 白ベースヒーロー + トレーナーカードギャラリー
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { TrainerCard } from "@/components/TrainerCard";
import { DUMMY_TEAMS } from "@/lib/dummy-teams";
import { getSuggestedPokemonNames, searchTeams } from "@/lib/search";
import { loadSavedTeams } from "@/lib/saved-teams";

export const dynamic = "force-dynamic"; // 保存データ反映のため毎回読み込み

export default async function HomePage() {
  const savedTeams = await loadSavedTeams();
  const allTeams = [...savedTeams, ...DUMMY_TEAMS];
  const latest = [...allTeams]
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 6);
  const suggestions = getSuggestedPokemonNames(searchTeams({ format: "single" }, savedTeams), [], 8);

  return (
    <div className="space-y-14">
      <SearchFilters
        initialFormat="single"
        initialPokemons={[]}
        suggestions={suggestions}
        sticky={false}
      />

      {/* ---- 新着カード ---- */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">
              LATEST RELEASES
            </p>
            <h2 className="mt-1 font-display text-2xl font-black text-slate-900">
              新着トレーナーカード
            </h2>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold tracking-wider text-cyan-600 hover:text-slate-900"
          >
            すべて見る →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((team) => (
            <TrainerCard key={team.id} team={team} />
          ))}
        </div>
      </section>
    </div>
  );
}
