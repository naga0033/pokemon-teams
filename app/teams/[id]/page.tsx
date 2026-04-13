// 個別構築詳細ページ (白地版)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeamRoster } from "@/components/TeamRoster";
import { CopyStatsButton } from "@/components/CopyStatsButton";
import { DUMMY_TEAMS } from "@/lib/dummy-teams";
import { loadSavedTeams } from "@/lib/saved-teams";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

// OGP メタデータ: X/Slack 等でリンクを貼ったときにカード表示させる
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const savedTeams = await loadSavedTeams();
  const allTeams = [...savedTeams, ...DUMMY_TEAMS];
  const team = allTeams.find((t) => t.id === id);
  if (!team) return {};

  const pokeNames = team.pokemons
    .map((p) => p.name)
    .filter(Boolean)
    .join(" / ");
  const formatLabel = team.format === "double" ? "ダブル" : "シングル";
  const title = `${team.title || team.author + "さんの構築"} | ポケコレ`;
  const description = `${formatLabel} | ${team.author}${team.rank ? ` | 最終${team.rank}位` : ""}${team.rating ? ` | レート${team.rating}` : ""} - ${pokeNames}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      // Next.js が同ディレクトリの opengraph-image.tsx を自動で OG 画像として参照
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TeamDetailPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const savedTeams = await loadSavedTeams();
  const allTeams = [...savedTeams, ...DUMMY_TEAMS];
  const team = allTeams.find((t) => t.id === id);
  if (!team) notFound();

  return (
    <div className="space-y-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
        <Link href="/" className="hover:text-cyan-600">
          HOME
        </Link>
        <span>›</span>
        <Link href="/search" className="hover:text-cyan-600">
          COLLECTION
        </Link>
        <span>›</span>
        <span className="text-slate-700">CARD</span>
      </div>

      {/* ヘッダー: 大きなトレーナーカードタイル風 */}
      <header className="card-frame">
        <div className="card-body relative p-8">
          <div className="pointer-events-none absolute inset-0 holo-foil opacity-50" />
          <div className="pointer-events-none absolute inset-0 sparkle-layer opacity-60" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-60 w-60 rounded-full bg-cyan-300/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-violet-300/30 blur-3xl"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                {team.format === "single" ? "SINGLE" : "DOUBLE"}
                {team.season && ` · ${team.season}`}
              </span>
              {team.rank != null && (
                <span className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2.5 py-1 text-amber-950">
                  FINAL #{team.rank}
                </span>
              )}
              {team.rating != null && (
                <span className="rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-cyan-700">
                  ★ {team.rating.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-2xl font-black text-slate-900 md:text-3xl">
              {team.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              TRAINER · <span className="text-slate-800">{team.author}</span>
              {team.authorXHandle && (
                <span className="ml-2 text-slate-400">{team.authorXHandle}</span>
              )}
            </p>
            {team.sourceUrl && (
              <a
                href={team.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full border border-cyan-300 bg-cyan-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700 hover:bg-cyan-100"
              >
                元記事を開く →
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 6 体詳細 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">
            · ROSTER
          </p>
          <CopyStatsButton team={team} />
        </div>
        <TeamRoster team={team} />
      </section>
    </div>
  );
}
