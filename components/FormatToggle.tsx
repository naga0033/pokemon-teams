"use client";
// シングル / ダブル セグメンテッドコントロール (白地版)
import type { Format } from "@/lib/types";

type Props = {
  value: Format | undefined;
  onChange: (format: Format) => void;
};

export function FormatToggle({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("single")}
        className={
          value === "single"
            ? "min-w-[180px] rounded-[18px] border border-sky-400 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] px-3.5 py-2.5 text-left shadow-[0_16px_30px_-24px_rgba(59,130,246,0.8)] ring-2 ring-sky-200"
            : "min-w-[180px] rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition hover:border-slate-300 hover:bg-white"
        }
      >
        <span className="flex items-start gap-3">
            <span className={`mt-0.5 h-4.5 w-4.5 rounded-full border ${value === "single" ? "border-sky-500 bg-sky-500 shadow-[inset_0_0_0_3px_white]" : "border-slate-300 bg-white"}`} />
          <span>
            <span className="block text-sm font-black text-slate-900">シングル</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">1体ずつ見たいとき向け</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("double")}
        className={
          value === "double"
            ? "min-w-[180px] rounded-[18px] border border-rose-300 bg-[linear-gradient(135deg,#fff1f2,#ffffff)] px-3.5 py-2.5 text-left shadow-[0_16px_30px_-24px_rgba(244,63,94,0.75)] ring-2 ring-rose-100"
            : "min-w-[180px] rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition hover:border-slate-300 hover:bg-white"
        }
      >
        <span className="flex items-start gap-3">
            <span className={`mt-0.5 h-4.5 w-4.5 rounded-full border ${value === "double" ? "border-rose-500 bg-rose-500 shadow-[inset_0_0_0_3px_white]" : "border-slate-300 bg-white"}`} />
          <span>
            <span className="block text-sm font-black text-slate-900">ダブル</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">並びと並走を見たいとき向け</span>
          </span>
        </span>
      </button>
    </div>
  );
}
