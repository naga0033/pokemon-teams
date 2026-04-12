// 実数値と努力値とベース種族値から性格を逆算するユーティリティ
// ポケチャンは Lv50 固定、個体値は全て31 (6V前提)
import { NATURES } from "./natures";

type StatKey = "attack" | "defense" | "spAtk" | "spDef" | "speed";

// 性格テーブル: [上がる, 下がる] (null,null は補正なし)
const NATURE_MODIFIERS: Record<string, [StatKey | null, StatKey | null]> = {
  さみしがり: ["attack", "defense"],
  いじっぱり: ["attack", "spAtk"],
  やんちゃ: ["attack", "spDef"],
  ゆうかん: ["attack", "speed"],
  ずぶとい: ["defense", "attack"],
  わんぱく: ["defense", "spAtk"],
  のうてんき: ["defense", "spDef"],
  のんき: ["defense", "speed"],
  ひかえめ: ["spAtk", "attack"],
  おっとり: ["spAtk", "defense"],
  うっかりや: ["spAtk", "spDef"],
  れいせい: ["spAtk", "speed"],
  おだやか: ["spDef", "attack"],
  おとなしい: ["spDef", "defense"],
  しんちょう: ["spDef", "spAtk"],
  なまいき: ["spDef", "speed"],
  おくびょう: ["speed", "attack"],
  せっかち: ["speed", "defense"],
  ようき: ["speed", "spAtk"],
  むじゃき: ["speed", "spDef"],
  てれや: [null, null],
  がんばりや: [null, null],
  すなお: [null, null],
  きまぐれ: [null, null],
  まじめ: [null, null],
};

/**
 * Lv50, 個体値31 前提でステータスの実数値を計算する
 * HP: (種族値 * 2 + 31 + ev/4) * 50/100 + 60
 * 他: ((種族値 * 2 + 31 + ev/4) * 50/100 + 5) * 性格補正
 */
function calcStat(
  base: number,
  ev: number,
  isHp: boolean,
  natureMultiplier: number,
): number {
  const iv = 31;
  const level = 50;
  if (isHp) {
    return Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  return Math.floor(
    (Math.floor(((base * 2 + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMultiplier,
  );
}

/**
 * 種族値 + 実数値 + 努力値 から性格を逆算する
 * 全25性格を試して、計算結果が一致するものを返す
 */
export function inferNature(
  baseStats: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number },
  actualStats: { hp?: number; attack?: number; defense?: number; spAtk?: number; spDef?: number; speed?: number },
  evs: { hp?: number; attack?: number; defense?: number; spAtk?: number; spDef?: number; speed?: number },
): string | null {
  const statKeys: StatKey[] = ["attack", "defense", "spAtk", "spDef", "speed"];

  // 既知の実数値が2つ以上ないと判定精度が低い
  const knownStats = statKeys.filter((k) => typeof actualStats[k] === "number" && actualStats[k]! > 0);
  if (knownStats.length < 2) return null;

  for (const nature of NATURES) {
    const [boosted, reduced] = NATURE_MODIFIERS[nature] ?? [null, null];
    let allMatch = true;

    for (const key of knownStats) {
      let multiplier = 1.0;
      if (boosted === key) multiplier = 1.1;
      if (reduced === key) multiplier = 0.9;

      const ev = evs[key] ?? 0;
      // ポケチャンの努力値は 0〜32 の独自スケール
      // 1ポイント = 実質 8EV 相当 (252 / 32 ≈ 8)
      const scaledEv = ev * 8;
      const expected = calcStat(baseStats[key], scaledEv, false, multiplier);
      const actual = actualStats[key]!;

      if (expected !== actual) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) return nature;
  }

  return null;
}
