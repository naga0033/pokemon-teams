"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyStatsButton } from "@/components/CopyStatsButton";
import { getOfficialArtworkUrl } from "@/lib/pokemon-sprite";
import { getEnSlug, EN_TO_JA } from "@/lib/pokemon-names";
import { MOVE_NAMES_JA } from "@/lib/move-names";
import { ABILITY_NAMES_JA } from "@/lib/ability-names";
import { ITEMS } from "@/lib/items";
import { NATURES } from "@/lib/natures";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { NatureIndicatorLabel } from "@/components/admin/NatureIndicator";
import type { StatValues, Team } from "@/lib/types";

const STAT_KEYS: Array<keyof StatValues> = ["hp", "attack", "defense", "spAtk", "spDef", "speed"];
const EMPTY_STATS: StatValues = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };

const POKEMON_JA_OPTIONS = Array.from(new Set(Object.values(EN_TO_JA))).filter(Boolean).sort();
const MOVE_JA_OPTIONS = Array.from(new Set(Object.values(MOVE_NAMES_JA))).filter(Boolean).sort();
const ABILITY_JA_OPTIONS = Array.from(new Set(Object.values(ABILITY_NAMES_JA))).filter(Boolean).sort();
const ITEM_JA_OPTIONS = ITEMS.map((i) => i.ja).filter((n): n is string => Boolean(n) && !n.startsWith("もちものを選択")).sort();

const TERA_TYPES = [
  "ノーマル", "ほのお", "みず", "でんき", "くさ", "こおり",
  "かくとう", "どく", "じめん", "ひこう", "エスパー", "むし",
  "いわ", "ゴースト", "ドラゴン", "あく", "はがね", "フェアリー", "ステラ",
];

type NatureStatKey = "attack" | "defense" | "spAtk" | "spDef" | "speed";
const NATURE_STAT_KEYS: NatureStatKey[] = ["attack", "defense", "spAtk", "spDef", "speed"];
const NATURE_STAT_LABELS: Record<NatureStatKey, string> = {
  attack: "攻撃", defense: "防御", spAtk: "特攻", spDef: "特防", speed: "素早さ",
};
const NATURE_GRID: string[][] = [
  ["がんばりや", "さみしがり", "いじっぱり", "やんちゃ",   "ゆうかん"],
  ["ずぶとい",   "すなお",     "わんぱく",   "のうてんき", "のんき"],
  ["ひかえめ",   "おっとり",   "てれや",     "うっかりや", "れいせい"],
  ["おだやか",   "おとなしい", "しんちょう", "きまぐれ",   "なまいき"],
  ["おくびょう", "せっかち",   "ようき",     "むじゃき",   "まじめ"],
];

type EditableTeam = Team;

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
        <div className="card-body p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={team.format}
                onChange={(e) => setTeam((c) => ({ ...c, format: e.target.value as Team["format"] }))}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="single">シングル</option>
                <option value="double">ダブル</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">構築名</span>
                <input value={team.title} onChange={(e) => setTeam((c) => ({ ...c, title: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none focus:border-cyan-400" />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">投稿者</span>
                <input value={team.author} onChange={(e) => setTeam((c) => ({ ...c, author: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400" />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">元URL</span>
                <input value={team.sourceUrl ?? ""} onChange={(e) => setTeam((c) => ({ ...c, sourceUrl: e.target.value || undefined }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">チームコード</span>
                <input value={team.teamCode ?? ""} onChange={(e) => setTeam((c) => ({ ...c, teamCode: e.target.value || undefined }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">レート (任意)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={team.rating ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setTeam((c) => ({ ...c, rating: undefined }));
                      return;
                    }
                    const num = Number.parseFloat(raw);
                    if (Number.isFinite(num)) {
                      setTeam((c) => ({ ...c, rating: num }));
                    }
                  }}
                  placeholder="例: 2048.5"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">· ROSTER EDITOR</p>
          <CopyStatsButton team={team} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {team.pokemons.map((pokemon, index) => (
            <div key={`${pokemon.slug}-${index}`} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400">SLOT {pokemon.slot ?? index + 1}</span>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded-xl bg-slate-50 ring-1 ring-slate-200">
                    <Image src={getOfficialArtworkUrl(pokemon.slug)} alt={pokemon.name} fill sizes="64px" className="object-contain p-1" unoptimized />
                  </div>

                  <div className="grid min-w-0 flex-1 gap-2">
                    <div className="grid gap-2 md:grid-cols-[1.2fr,0.8fr]">
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">ポケモン名</span>
                        <SearchableSelect
                          value={pokemon.name} onChange={(v) => updatePokemon(index, (c) => ({ ...c, name: v, slug: getEnSlug(v) ?? c.slug }))}
                          options={POKEMON_JA_OPTIONS} placeholder="ポケモン名"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-black text-slate-900 outline-none focus:border-cyan-400" />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">テラスタイプ</span>
                        <TeraTypeGrid value={pokemon.teraType ?? null} onChange={(v) => updatePokemon(index, (c) => ({ ...c, teraType: v ?? undefined }))} />
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">特性</span>
                        <SearchableSelect
                          value={pokemon.ability ?? ""} onChange={(v) => updatePokemon(index, (c) => ({ ...c, ability: v || undefined }))}
                          options={ABILITY_JA_OPTIONS} placeholder="特性"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">持ち物</span>
                        <SearchableSelect
                          value={pokemon.item ?? ""} onChange={(v) => updatePokemon(index, (c) => ({ ...c, item: v || undefined }))}
                          options={ITEM_JA_OPTIONS} placeholder="持ち物"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                  {[0, 1, 2, 3].map((moveIndex) => (
                    <SearchableSelect
                      key={moveIndex}
                      value={pokemon.moves[moveIndex] ?? ""}
                      onChange={(v) => updatePokemon(index, (c) => {
                        const moves = [...c.moves];
                        while (moves.length < 4) moves.push("");
                        moves[moveIndex] = v;
                        return { ...c, moves };
                      })}
                      options={MOVE_JA_OPTIONS} placeholder={`技${moveIndex + 1}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-cyan-400" />
                  ))}
                </div>

                <NaturePalette value={pokemon.nature ?? null} onChange={(v) => updatePokemon(index, (c) => ({ ...c, nature: v ?? undefined }))} />

                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">実数値 / 努力値</p>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px]">
                    {([["HP","hp"],["こうげき","attack"],["ぼうぎょ","defense"],["とくこう","spAtk"],["とくぼう","spDef"],["すばやさ","speed"]] as const).map(([label, key]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="w-14 shrink-0 text-slate-500">{label}{key !== "hp" && <NatureIndicatorLabel nature={pokemon.nature} stat={key} />}</span>
                        <input type="number" value={pokemon.stats?.[key] ?? ""} onFocus={(e) => e.target.select()}
                          onChange={(e) => updatePokemon(index, (c) => ({ ...c, stats: { ...(c.stats ?? EMPTY_STATS), [key]: Number(e.target.value) || 0 } }))}
                          className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-slate-900 outline-none focus:border-cyan-400" />
                        <input type="number" value={pokemon.evs?.[key] ?? ""} onFocus={(e) => e.target.select()}
                          onChange={(e) => updatePokemon(index, (c) => ({ ...c, evs: { ...(c.evs ?? EMPTY_STATS), [key]: Number(e.target.value) || 0 } }))}
                          className={`w-12 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center font-mono text-[10px] outline-none focus:border-amber-400 ${(pokemon.evs?.[key] ?? 0) > 0 ? "font-bold text-amber-600" : "text-slate-400"}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={async () => {
          setSaving(true); setError(null); setMessage(null);
          try {
            // rating は undefined だと JSON で省略されるので、クリアを確実に伝えるため null で送る
            const payload = { ...team, rating: team.rating ?? null };
            const res = await fetch(`/api/teams/${team.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "保存に失敗しました");
            setMessage("保存しました"); router.refresh();
          } catch (err) { setError(err instanceof Error ? err.message : "保存に失敗しました"); }
          finally { setSaving(false); }
        }} className="btn-neon rounded-full px-5 py-2.5 text-sm disabled:opacity-60" disabled={saving}>
          {saving ? "保存中…" : "この内容で保存"}
        </button>
        {message && <span className="text-sm text-emerald-600">{message}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </div>
  );
}

function TeraTypeGrid({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="grid grid-cols-5 gap-0.5">
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(null)}
        className={`py-1 text-[9px] rounded border font-bold transition-colors ${!value ? "bg-slate-500 text-white border-slate-500" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"}`}>なし</button>
      {TERA_TYPES.map((t) => (
        <button key={t} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(t)}
          className={`py-1 text-[9px] rounded border font-bold transition-colors ${value === t ? "bg-violet-500 text-white border-violet-500" : "bg-white text-slate-600 border-slate-200 hover:bg-violet-50 hover:border-violet-300"}`}>{t}</button>
      ))}
    </div>
  );
}

function NaturePalette({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
      <p className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">性格補正</p>
      <div className="grid grid-cols-6 border-b border-slate-100">
        <div className="bg-slate-50" />
        {NATURE_STAT_KEYS.map((key) => (
          <div key={key} className="bg-indigo-50 px-0.5 py-1 text-center text-[9px] font-bold text-indigo-600 border-l border-slate-100">
            {NATURE_STAT_LABELS[key]}<span className="text-sky-500">↓</span>
          </div>
        ))}
      </div>
      {NATURE_GRID.map((row, ri) => (
        <div key={ri} className="grid grid-cols-6">
          <div className="bg-indigo-50 flex items-center justify-center px-0.5 py-1 border-t border-slate-100">
            <span className="text-[9px] font-bold text-indigo-600">{NATURE_STAT_LABELS[NATURE_STAT_KEYS[ri]]}<span className="text-rose-500">↑</span></span>
          </div>
          {row.map((nature, ci) => (
            <button key={nature} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(nature)}
              className={`py-1 text-[10px] font-medium border-t border-l border-slate-100 transition-colors ${value === nature ? "bg-green-500 text-white font-bold" : ri === ci ? "bg-slate-100 text-slate-400 hover:bg-slate-200" : "hover:bg-indigo-50 text-slate-700"}`}>{nature}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
