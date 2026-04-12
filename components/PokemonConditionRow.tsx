"use client";

import { useMemo, useRef, useState } from "react";
import { getRankedPokemonCandidates } from "@/lib/usage-ranking";
import type { Format } from "@/lib/types";

type Props = {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  removable?: boolean;
  format: Format;
};

export function PokemonConditionRow({
  index,
  value,
  onChange,
  onRemove,
  removable = true,
  format,
}: Props) {
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const candidates = useMemo(() => {
    return getRankedPokemonCandidates(format, value, 20);
  }, [format, value]);

  const selectCandidate = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_-22px_rgba(15,23,42,0.28)]">
      <div className="grid gap-2.5 md:grid-cols-[110px,1fr,auto] md:items-center">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm font-extrabold text-slate-900">ポケモン{index + 1}</p>
        </div>

        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">ポケモン名</label>
          <input
            ref={inputRef}
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
            onFocus={() => {
              setOpen(true);
              inputRef.current?.select();
            }}
            onBlur={() => {
              setTimeout(() => setOpen(false), 120);
            }}
            placeholder="例: カイリュー"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />

          {open && candidates.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
              <p className="px-2 pb-1 text-[11px] font-bold tracking-[0.14em] text-slate-400">
                {value.trim() ? "候補" : "採用ランキング上位"}
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

        <div className="flex gap-2 md:self-center">
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
              aria-label={`ポケモン${index + 1}を削除`}
            >
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
