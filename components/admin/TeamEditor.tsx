"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyStatsButton } from "@/components/CopyStatsButton";
import { getOfficialArtworkUrl } from "@/lib/pokemon-sprite";
import type { StatValues, Team } from "@/lib/types";

const STAT_KEYS: Array<keyof StatValues> = ["hp", "attack", "defense", "spAtk", "spDef", "speed"];
const EMPTY_STATS: StatValues = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };

type EditableTeam = Team;

function fieldClassName() {
  return "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400";
}

export function TeamEditor({ initialTeam }: { initialTeam: Team }) {
  const router = useRouter();
  const [team, setTeam] = useState<EditableTeam>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updatePokemon = (
    slotIndex: number,
    updater: (pokemon: EditableTeam["pokemons"][number]) => EditableTeam["pokemons"][number],
  ) => {
    setTeam((current) => ({
      ...current,
      pokemons: current.pokemons.map((pokemon, index) =>
        index === slotIndex ? updater(pokemon) : pokemon,
      ),
    }));
  };

  return (
    <div className="space-y-8">
      <header className="card-frame">
        <div className="card-body relative p-8">
          <div className="pointer-events-none absolute inset-0 sparkle-layer opacity-60" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-60 w-60 rounded-full bg-cyan-300/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-violet-300/30 blur-3xl"
          />

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                ADMIN MODE
              </span>
              <select
                value={team.format}
                onChange={(e) =>
                  setTeam((current) => ({
                    ...current,
                    format: e.target.value as Team["format"],
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-cyan-300"
              >
                <option value="single">シングル</option>
                <option value="double">ダブル</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-400">構築名</span>
                <input
                  value={team.title}
                  onChange={(e) =>
                    setTeam((current) => ({ ...current, title: e.target.value }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-400">投稿者</span>
                <input
                  value={team.author}
                  onChange={(e) =>
                    setTeam((current) => ({ ...current, author: e.target.value }))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-400">元URL</span>
                <input
                  value={team.sourceUrl ?? ""}
                  onChange={(e) =>
                    setTeam((current) => ({
                      ...current,
                      sourceUrl: e.target.value || undefined,
                    }))
                  }
                  className={fieldClassName()}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-400">チームコード</span>
                <input
                  value={team.teamCode ?? ""}
                  onChange={(e) =>
                    setTeam((current) => ({
                      ...current,
                      teamCode: e.target.value || undefined,
                    }))
                  }
                  className={fieldClassName()}
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">
            · ROSTER EDITOR
          </p>
          <CopyStatsButton team={team} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {team.pokemons.map((pokemon, index) => (
            <div key={`${pokemon.slug}-${index}`} className="card-frame">
              <div className="card-body relative p-5">
                <div className="pointer-events-none absolute inset-0 sparkle-layer opacity-40" />

                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="relative h-28 w-28 shrink-0 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                      <Image
                        src={getOfficialArtworkUrl(pokemon.slug)}
                        alt={pokemon.name}
                        fill
                        sizes="112px"
                        className="object-contain p-1 drop-shadow-[0_2px_8px_rgba(139,92,246,0.25)]"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          SLOT {pokemon.slot ?? index + 1}
                        </span>
                      </div>

                      <div className="grid gap-2 md:grid-cols-[1.3fr,0.9fr]">
                        <input
                          value={pokemon.name}
                          onChange={(e) =>
                            updatePokemon(index, (current) => ({
                              ...current,
                              name: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-lg font-black text-slate-900 outline-none transition focus:border-cyan-400"
                          placeholder="ポケモン名"
                        />
                        <input
                          value={pokemon.teraType ?? ""}
                          onChange={(e) =>
                            updatePokemon(index, (current) => ({
                              ...current,
                              teraType: e.target.value || undefined,
                            }))
                          }
                          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 outline-none transition focus:border-violet-400"
                          placeholder="テラスタイプ"
                        />
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <input
                          value={pokemon.ability ?? ""}
                          onChange={(e) =>
                            updatePokemon(index, (current) => ({
                              ...current,
                              ability: e.target.value || undefined,
                            }))
                          }
                          className={fieldClassName()}
                          placeholder="特性"
                        />
                        <input
                          value={pokemon.item ?? ""}
                          onChange={(e) =>
                            updatePokemon(index, (current) => ({
                              ...current,
                              item: e.target.value || undefined,
                            }))
                          }
                          className={fieldClassName()}
                          placeholder="持ち物"
                        />
                        <input
                          value={pokemon.nature ?? ""}
                          onChange={(e) =>
                            updatePokemon(index, (current) => ({
                              ...current,
                              nature: e.target.value || undefined,
                            }))
                          }
                          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-bold text-violet-700 outline-none transition focus:border-violet-400"
                          placeholder="性格"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px]">
                    {[0, 1, 2, 3].map((moveIndex) => (
                      <input
                        key={moveIndex}
                        value={pokemon.moves[moveIndex] ?? ""}
                        onChange={(e) =>
                          updatePokemon(index, (current) => {
                            const moves = [...current.moves];
                            while (moves.length < 4) moves.push("");
                            moves[moveIndex] = e.target.value;
                            return { ...current, moves };
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none transition focus:border-cyan-400"
                        placeholder={`技${moveIndex + 1}`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">
                      ステータス / 努力値
                    </p>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-[11px]">
                      {([
                        ["HP", "hp"],
                        ["こうげき", "attack"],
                        ["ぼうぎょ", "defense"],
                        ["とくこう", "spAtk"],
                        ["とくぼう", "spDef"],
                        ["すばやさ", "speed"],
                      ] as const).map(([label, key]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-slate-500">{label}</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              value={pokemon.stats?.[key] ?? 0}
                              onChange={(e) =>
                                updatePokemon(index, (current) => ({
                                  ...current,
                                  stats: {
                                    ...(current.stats ?? EMPTY_STATS),
                                    [key]: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-mono text-slate-900 outline-none transition focus:border-cyan-400"
                              placeholder="実数値"
                            />
                            <input
                              type="number"
                              value={pokemon.evs?.[key] ?? 0}
                              onChange={(e) =>
                                updatePokemon(index, (current) => ({
                                  ...current,
                                  evs: {
                                    ...(current.evs ?? EMPTY_STATS),
                                    [key]: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-mono text-amber-700 outline-none transition focus:border-amber-400"
                              placeholder="努力値"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            setSaving(true);
            setError(null);
            setMessage(null);
            try {
              const res = await fetch(`/api/teams/${team.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(team),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error ?? "保存に失敗しました");
              setMessage("保存しました");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "保存に失敗しました");
            } finally {
              setSaving(false);
            }
          }}
          className="btn-neon rounded-full px-5 py-2.5 text-sm disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "保存中…" : "この内容で保存"}
        </button>
        {message && <span className="text-sm text-emerald-600">{message}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
