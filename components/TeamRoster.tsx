// 構築詳細ページ用 (白地版): 6 体を 2 カラムで並べる + ステータス/努力値/性格対応
import Image from "next/image";
import type { Team } from "@/lib/types";
import { getOfficialArtworkUrl } from "@/lib/pokemon-sprite";

type Props = {
  team: Team;
};

export function TeamRoster({ team }: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {team.pokemons.map((p, idx) => (
        <div key={`${p.slug}-${idx}`} className="card-frame">
          <div className="card-body relative p-5">
            {/* ホロ背景 */}
            <div className="pointer-events-none absolute inset-0 sparkle-layer opacity-40" />

            <div className="relative flex gap-4">
              {/* 画像 */}
              <div className="relative h-28 w-28 shrink-0 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                <Image
                  src={getOfficialArtworkUrl(p.slug)}
                  alt={p.name}
                  fill
                  sizes="112px"
                  className="object-contain p-1 drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]"
                  unoptimized
                />
              </div>

              {/* テキスト */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-extrabold text-slate-900">
                    {p.name}
                  </h3>
                  {p.teraType && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-200">
                      TERA · {p.teraType}
                    </span>
                  )}
                </div>

                <dl className="mt-1.5 space-y-0.5 text-xs text-slate-600">
                  {p.ability && (
                    <div>
                      <dt className="inline text-slate-400">特性: </dt>
                      <dd className="inline">{p.ability}</dd>
                    </div>
                  )}
                  {p.item && (
                    <div>
                      <dt className="inline text-slate-400">持ち物: </dt>
                      <dd className="inline">{p.item}</dd>
                    </div>
                  )}
                  {p.nature && (
                    <div>
                      <dt className="inline text-slate-400">性格: </dt>
                      <dd className="inline font-bold text-violet-600">{p.nature}</dd>
                    </div>
                  )}
                </dl>

                <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                  {p.moves.map((move, i) => (
                    <li
                      key={`${move}-${i}`}
                      className="truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
                    >
                      <span className="mr-1 text-cyan-500">›</span>
                      {move}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ステータス/努力値 (データがある場合) */}
            {p.stats && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">
                  ステータス / 努力値
                </p>
                <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
                  {([
                    ["HP", "hp"],
                    ["こうげき", "attack"],
                    ["ぼうぎょ", "defense"],
                    ["とくこう", "spAtk"],
                    ["とくぼう", "spDef"],
                    ["すばやさ", "speed"],
                  ] as const).map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {p.stats?.[key] ?? "?"}
                        {p.evs && (
                          <span className={`ml-1 text-[10px] ${(p.evs[key] ?? 0) > 0 ? "font-bold text-amber-600" : "text-slate-400"}`}>
                            ({p.evs[key] ?? 0})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
