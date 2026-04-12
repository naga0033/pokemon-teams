"use client";
// ポケモン名チップ入力 (白地版): 日本語ファジー候補を出しつつチップ追加/削除
import { useMemo, useRef, useState } from "react";
import { EN_TO_JA } from "@/lib/pokemon-names";
import { normalizeJaText } from "@/lib/japanese-match";

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
};

// 日本語名の一覧 (重複除去)
const ALL_JA_NAMES: string[] = Array.from(new Set(Object.values(EN_TO_JA)));

// 検索用に正規化済みインデックスを用意
const NORMALIZED_INDEX: Array<{ ja: string; normalized: string }> = ALL_JA_NAMES.map((ja) => ({
  ja,
  normalized: normalizeJaText(ja),
}));

export function PokemonChipInput({ values, onChange, max = 6, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ファジー候補 (正規化部分一致)
  const candidates = useMemo(() => {
    const q = normalizeJaText(query);
    if (!q) return [];
    const prefix: string[] = [];
    const contains: string[] = [];
    for (const { ja, normalized } of NORMALIZED_INDEX) {
      if (values.includes(ja)) continue;
      if (normalized.startsWith(q)) prefix.push(ja);
      else if (normalized.includes(q)) contains.push(ja);
    }
    return [...prefix, ...contains].slice(0, 8);
  }, [query, values]);

  const addChip = (name: string) => {
    if (values.includes(name)) return;
    if (values.length >= max) return;
    onChange([...values, name]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeChip = (name: string) => {
    onChange(values.filter((v) => v !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (candidates.length > 0) addChip(candidates[0]);
    } else if (e.key === "Backspace" && query === "" && values.length > 0) {
      removeChip(values[values.length - 1]);
    }
  };

  const remaining = max - values.length;

  return (
    <div className="relative w-full">
      <div className="neon-input flex min-h-[48px] flex-wrap items-center gap-2 rounded-2xl px-3 py-2 transition">
        {values.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-100 to-violet-100 px-2.5 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-300/70"
          >
            {name}
            <button
              type="button"
              onClick={() => removeChip(name)}
              className="ml-0.5 rounded-full text-cyan-600 hover:text-slate-900"
              aria-label={`${name} を削除`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false);
            setQuery((e.target as HTMLInputElement).value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder={
            values.length >= max
              ? `最大 ${max} 匹まで`
              : placeholder ?? "ポケモン名を入力  例: ピカチュウ"
          }
          disabled={values.length >= max}
          className="flex-1 min-w-[140px] border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
          あと{remaining}匹
        </span>
      </div>

      {/* 候補リスト */}
      {open && candidates.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {candidates.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addChip(name);
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-sky-50 hover:text-slate-900"
              >
                <span className="font-semibold">{name}</span>
                <span className="ml-2 text-xs text-slate-400">候補</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
