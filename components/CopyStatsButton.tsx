"use client";
// 6 匹分のステータスをテキスト化してクリップボードにコピーするボタン
// damage-calc のテキスト読み込みで使える形式で出力する
import { useState } from "react";
import type { Team } from "@/lib/types";

type Props = {
  team: Team;
};

type PokemonSlotWithStats = Team["pokemons"][number] & {
  nature?: string;
  stats?: Record<string, number>;
  evs?: Record<string, number>;
};

/**
 * ダメ計に読み込ませやすいテキスト形式で 6 匹分を出力
 * 例:
 * ===== マフォクシー =====
 * マフォクシー @ マフォクシーナイト
 * 特性: もうか
 * 性格: ひかえめ
 * テラスタイプ: ほのお
 * 努力値: H0 A0 B0 C32 D2 S32
 * 実数値: 150-80-92-166-122-171
 * 技: サイコキネシス / みがわり / アンコール / マフォクシナイト
 */
function formatTeamText(team: Team): string {
  const lines: string[] = [];

  for (const p of team.pokemons) {
    const pokemon = p as PokemonSlotWithStats;
    lines.push(`===== ${pokemon.name} =====`);

    // 名前 @ 持ち物
    const nameLine = pokemon.item
      ? `${pokemon.name} @ ${pokemon.item}`
      : pokemon.name;
    lines.push(nameLine);

    if (pokemon.ability) lines.push(`特性: ${pokemon.ability}`);
    if (pokemon.nature) lines.push(`性格: ${pokemon.nature}`);
    if (pokemon.teraType) lines.push(`テラスタイプ: ${pokemon.teraType}`);

    // 努力値
    if (pokemon.evs) {
      const e = pokemon.evs;
      lines.push(
        `努力値: H${e.hp ?? 0} A${e.attack ?? 0} B${e.defense ?? 0} C${e.spAtk ?? 0} D${e.spDef ?? 0} S${e.speed ?? 0}`,
      );
    }

    // 実数値
    if (pokemon.stats) {
      const s = pokemon.stats;
      lines.push(
        `実数値: ${s.hp ?? "?"}-${s.attack ?? "?"}-${s.defense ?? "?"}-${s.spAtk ?? "?"}-${s.spDef ?? "?"}-${s.speed ?? "?"}`,
      );
    }

    // 技
    if (pokemon.moves.length > 0) {
      lines.push(`技: ${pokemon.moves.join(" / ")}`);
    }

    lines.push(""); // 空行で区切り
  }

  return lines.join("\n").trim();
}

export function CopyStatsButton({ team }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = formatTeamText(team);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック: テキストエリアを使ったコピー
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        copied
          ? "rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-300"
          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
      }
    >
      {copied ? "✓ コピーしました！" : "📋 すべてのステータスを文字化"}
    </button>
  );
}
