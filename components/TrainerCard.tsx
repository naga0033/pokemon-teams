// 構築 1 件をトレーナーカード風に見せるコンポーネント (白地版)
// ホロ効果・カラフル枠・ランク章で "コレクションしたくなる" 見た目を狙う
import Link from "next/link";
import Image from "next/image";
import type { Team } from "@/lib/types";
import { getListSpriteUrl } from "@/lib/pokemon-sprite";

type Props = {
  team: Team;
  /** 検索結果内での順位 (0 始まり) - 演出用 */
  index?: number;
};

/** 順位から金/銀/銅/通常クラスを決定 */
function rankClass(rank?: number): string {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "rank-default";
}

export function TrainerCard({ team }: Props) {
  const topRank = team.rank ?? null;

  return (
    <Link href={`/teams/${team.id}`} className="block">
      <div className="card-frame card-hover">
        <div className="card-body p-5">
          <div className="pointer-events-none absolute inset-0 sparkle-layer opacity-35" />

          <div className="relative">
            {/* ---- 上部: フォーマット & 投稿者 ---- */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                <span
                  className={
                    team.format === "single" ? "text-cyan-500" : "text-pink-500"
                  }
                >
                  ●
                </span>
                {team.format === "single" ? "シングル" : "ダブル"}
                {team.season && (
                  <span className="ml-1 text-slate-400">· {team.season}</span>
                )}
              </span>

              {topRank != null && (
                <div
                  className={`${rankClass(topRank)} flex h-10 w-10 items-center justify-center rounded-full text-sm font-black shadow-md ring-2 ring-white`}
                  title={`最終 ${topRank} 位`}
                >
                  <span className="leading-none">
                    <span className="text-[8px] align-top">#</span>
                    {topRank}
                  </span>
                </div>
              )}
            </div>

            {/* ---- タイトル ---- */}
            <h3 className="mt-4 font-display text-[15px] font-extrabold leading-snug text-slate-900 line-clamp-2">
              {team.title}
            </h3>

            {/* ---- 投稿者・レート ---- */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                <span className="font-medium text-slate-700">{team.author}</span>
              </span>
              {team.rating != null && (
                <span className="font-mono text-cyan-600">
                  ★ {team.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* ---- 6 体ロスター: 2 行 3 列グリッド ---- */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {team.pokemons.map((p, idx) => (
                <div
                  key={`${p.slug}-${idx}`}
                  className="relative aspect-square rounded-lg bg-white"
                  title={p.name}
                >
                  <Image
                    src={getListSpriteUrl(p.slug)}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 72px, 90px"
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              ))}
            </div>

            {/* ---- 下部バー ---- */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-400">
              <span className="tracking-wider">ポケチャン · S{team.season?.replace(/^S/i, "") ?? "-"}</span>
              <span className="font-mono text-cyan-500/80">
                {team.id.slice(0, 10).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
