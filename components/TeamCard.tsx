// 構築記事 1 件を表すカード (サーバーコンポーネント)
import Link from "next/link";
import Image from "next/image";
import type { Team } from "@/lib/types";
import { getHomeSpriteUrl } from "@/lib/pokemon-sprite";

type Props = {
  team: Team;
};

export function TeamCard({ team }: Props) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
    >
      {/* 上部メタ情報 */}
      <div className="flex items-center gap-2 text-xs">
        {team.season && (
          <span className="rounded bg-emerald-400 px-2 py-0.5 font-semibold text-white">
            シーズン{team.season.replace(/^S/i, "")}
          </span>
        )}
        <span className="rounded border border-slate-300 px-1.5 py-0.5 font-medium text-slate-600">
          {team.format === "single" ? "シングル" : "ダブル"}
        </span>
        {team.rank != null && (
          <span className="font-semibold text-slate-700">{team.rank}位</span>
        )}
        {team.rating != null && (
          <span className="text-slate-500">/ {team.rating.toFixed(1)}</span>
        )}
        <span className="ml-auto flex items-center gap-1 text-slate-500">
          <span aria-hidden className="inline-block h-4 w-4 rounded-full bg-slate-300" />
          {team.author}
        </span>
      </div>

      {/* 6 体スプライト */}
      <div className="mt-3 flex items-center justify-between gap-1 rounded-md bg-slate-50 px-2 py-3">
        {team.pokemons.map((p, idx) => (
          <div key={`${p.slug}-${idx}`} className="relative h-14 w-14 shrink-0">
            <Image
              src={getHomeSpriteUrl(p.slug)}
              alt={p.name}
              fill
              sizes="56px"
              className="object-contain"
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* タイトル */}
      <div className="mt-3 text-center text-sm font-semibold text-indigo-600 hover:underline">
        {team.title}
      </div>
    </Link>
  );
}
