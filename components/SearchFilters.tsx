"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PokemonConditionRow } from "./PokemonConditionRow";
import type { Format } from "@/lib/types";

type Props = {
  initialFormat?: Format;
  initialPokemons: string[];
  /** 候補サジェスト (現在は未表示だが互換のため受け取る) */
  suggestions?: string[];
  sticky?: boolean;
};

export function SearchFilters({
  initialFormat = "single",
  initialPokemons,
  sticky = false,
}: Props) {
  const router = useRouter();
  const [format, setFormat] = useState<Format>(initialFormat);
  const [pokemonRows, setPokemonRows] = useState<string[]>(
    initialPokemons.length > 0 ? initialPokemons : [""],
  );

  const normalizedRows = pokemonRows.map((name) => name.trim()).filter(Boolean);

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("format", format);
    for (const p of normalizedRows) params.append("pokemon", p);
    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setFormat("single");
    setPokemonRows([""]);
    router.push(`/search`);
  };

  const updateRow = (index: number, nextValue: string) => {
    setPokemonRows((current) => current.map((value, i) => (i === index ? nextValue : value)));
  };

  const addRow = () => {
    setPokemonRows((current) => {
      if (current.length >= 6) return current;
      return [...current, ""];
    });
  };

  const removeRow = (index: number) => {
    setPokemonRows((current) => {
      if (current.length === 1) return [""];
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  return (
    <section className={sticky ? "sticky top-[68px] z-30 mb-8" : "mb-8"}>
      <div className="isolate overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_20px_-18px_rgba(15,23,42,0.18)]">
        {/* ===== ヘッダー: タイトル + 形式トグル + クリア ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[linear-gradient(135deg,#1f2a44,#324b7d)] px-4 py-3 text-white md:px-5">
          {/* 左: アイコン + タイトル */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4.5 w-4.5"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.22em] text-sky-100/80">SEARCH STUDIO</p>
              <h2 className="mt-0.5 text-lg font-black md:text-xl">構築をしぼりこむ</h2>
            </div>
          </div>

          {/* 右: コンパクトな形式トグル + クリア */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
              <button
                type="button"
                onClick={() => setFormat("single")}
                className={
                  format === "single"
                    ? "rounded-full bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-sm"
                    : "rounded-full px-4 py-1.5 text-xs font-bold text-white/70 transition hover:text-white"
                }
              >
                シングル
              </button>
              <button
                type="button"
                onClick={() => setFormat("double")}
                className={
                  format === "double"
                    ? "rounded-full bg-white px-4 py-1.5 text-xs font-black text-rose-600 shadow-sm"
                    : "rounded-full px-4 py-1.5 text-xs font-bold text-white/70 transition hover:text-white"
                }
              >
                ダブル
              </button>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full bg-white/0 px-3 py-1.5 text-xs font-bold text-white/70 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
            >
              クリア
            </button>
          </div>
        </div>

        {/* ===== 本体: ポケモン条件行 + 追加 + 検索 ===== */}
        <div className="space-y-3 bg-[linear-gradient(180deg,#fffdf8,white_18%,#f8fbff)] px-4 py-4 md:px-5">
          <div className="space-y-2.5">
            {pokemonRows.map((name, index) => (
              <PokemonConditionRow
                key={`pokemon-row-${index}`}
                index={index}
                value={name}
                onChange={(nextValue) => updateRow(index, nextValue)}
                onRemove={() => removeRow(index)}
                removable={pokemonRows.length > 1}
              />
            ))}
          </div>

          {/* 条件追加 */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-2.5">
            <div>
              <p className="text-sm font-bold text-slate-700">ポケモン条件を追加</p>
              <p className="text-xs text-slate-500">まだ足りなければ、条件をもう1つ増やせます。</p>
            </div>
            <button
              type="button"
              onClick={addRow}
              disabled={pokemonRows.length >= 6}
              className="rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-sm font-bold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              + 条件を追加
            </button>
          </div>

          {/* 検索ボタン */}
          <div className="rounded-[20px] bg-slate-900 p-3.5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-slate-400">READY</p>
                <p className="mt-1 text-xs text-slate-200">
                  ひらがな・カタカナ・半角全角の違いは吸収して検索します。
                </p>
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="btn-neon rounded-full px-6 py-2.5 text-sm"
              >
                この条件で検索する
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
