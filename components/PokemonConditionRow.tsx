"use client";

import { useMemo, useState } from "react";
import { EN_TO_JA } from "@/lib/pokemon-names";
import { normalizeJaText } from "@/lib/japanese-match";

type Props = {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  removable?: boolean;
};

const ALL_JA_NAMES: string[] = Array.from(new Set(Object.values(EN_TO_JA)));

const NORMALIZED_INDEX: Array<{ ja: string; normalized: string }> = ALL_JA_NAMES.map((ja) => ({
  ja,
  normalized: normalizeJaText(ja),
}));

export function PokemonConditionRow({
  index,
  value,
  onChange,
  onRemove,
  removable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);

  const candidates = useMemo(() => {
    const q = normalizeJaText(value);
    if (!q) return [];

    const prefix: string[] = [];
    const contains: string[] = [];

    for (const { ja, normalized } of NORMALIZED_INDEX) {
      if (normalized.startsWith(q)) prefix.push(ja);
      else if (normalized.includes(q)) contains.push(ja);
    }

    return [...prefix, ...contains].slice(0, 8);
  }, [value]);

  const selectCandidate = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_-22px_rgba(15,23,42,0.28)]">
      <div className="grid gap-2.5 md:grid-cols-[150px,1fr,auto] md:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100 text-base shadow-inner">
            {index + 1}
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">POKEMON SLOT</p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-900">
              条件{index + 1}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              入力すると候補が出ます
            </p>
          </div>
        </div>

        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">ポケモン名</label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(e) => {
              if (composing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                if (candidates.length > 0) {
                  selectCandidate(candidates[0]);
                } else {
                  setOpen(false);
                }
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 120);
            }}
            placeholder="例: カイリュー"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />

          {open && value.trim() && candidates.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 pb-1 text-[11px] font-bold tracking-[0.14em] text-slate-400">
                候補
              </p>
              <ul className="space-y-1">
                {candidates.map((name) => (
                  <li key={`${index}-${name}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectCandidate(name);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-sky-50 hover:text-slate-900"
                    >
                      <span className="font-semibold">{name}</span>
                      <span className="text-[11px] text-slate-400">選択</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 md:pt-6">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
            >
              クリア
            </button>
          )}
          {removable && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={`条件${index + 1}を削除`}
            >
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
