// ホームページ: 白ベースヒーロー + トレーナーカードギャラリー
import Link from "next/link";
import { SearchFilters } from "@/components/SearchFilters";
import { TrainerCard } from "@/components/TrainerCard";
import { DUMMY_TEAMS } from "@/lib/dummy-teams";
import { loadSavedTeams } from "@/lib/saved-teams";
import { getUsageSuggestNames } from "@/lib/usage-ranking";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic"; // 保存データ反映のため毎回読み込み

export default async function HomePage() {
  const savedTeams = await loadSavedTeams();
  // savedTeams は DB 側で created_at DESC で取得済み。
  // registeredAt は手動入力できる過去日付なので、投稿順にはならない。
  // DB の取得順をそのまま維持して先頭 6 件を新着として扱う。
  const allTeams = [...savedTeams, ...DUMMY_TEAMS];
  const latest = allTeams.slice(0, 6);
  const suggestions = getUsageSuggestNames("single", [], 8);
  const isAdmin = await isAdminSession();

  return (
    <div className="space-y-14">
      <SearchFilters
        initialFormat="single"
        initialPokemons={[]}
        suggestions={suggestions}
        sticky={false}
      />

      {/* 管理者のみ: 取り込みページへのショートカット */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/ingest"
            className="rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-white shadow hover:bg-cyan-600"
          >
            ＋ 構築を取り込む
          </Link>
          <Link
            href="/admin/teams"
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            構築一覧を編集
          </Link>
        </div>
      )}

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
