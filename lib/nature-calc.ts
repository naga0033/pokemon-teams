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
 * ある種族値・実数値・補正倍率を満たす EV を [0, 252] 範囲から探し、
 * targetEv に一番近い EV を返す (該当なしなら null)。
 * OCR で努力値を読み違えた場合でも実数値から逆算して性格を特定するために使う。
 */
function findBestEvMatch(
  base: number,
  actualStat: number,
  multiplier: number,
  targetEv: number,
): number | null {
  let bestEv: number | null = null;
  let bestDelta = Infinity;
  for (let ev = 0; ev <= 252; ev++) {
    const val = calcStat(base, ev, false, multiplier);
    if (val === actualStat) {
      const delta = Math.abs(ev - targetEv);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestEv = ev;
      }
    }
  }
  return bestEv;
}

/**
 * 種族値 + 実数値 + 努力値 から性格を逆算する
 * 各性格について「その補正倍率で実数値を満たす EV が存在するか」を確認し、
 * 成立する性格のうち OCR 報告 EV に最も近い候補を返す。
 * 無補正性格 (5種) は効果が同じなので canonical "まじめ" に統一。
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

  type Candidate = { nature: string; totalDelta: number; neutral: boolean };
  const candidates: Candidate[] = [];

  for (const nature of NATURES) {
    const [boosted, reduced] = NATURE_MODIFIERS[nature] ?? [null, null];
    let totalDelta = 0;
    let allValid = true;

    for (const key of knownStats) {
      let multiplier = 1.0;
      if (boosted === key) multiplier = 1.1;
      if (reduced === key) multiplier = 0.9;

      // OCR で読み取った EV を targetEv として、倍率に合う EV を再探索
      const targetEv = (evs[key] ?? 0) * 8;
      const matchedEv = findBestEvMatch(
        baseStats[key],
        actualStats[key]!,
        multiplier,
        targetEv,
      );

      if (matchedEv === null) {
        allValid = false;
        break;
      }
      totalDelta += Math.abs(matchedEv - targetEv);
    }

    if (allValid) {
      candidates.push({
        nature,
        totalDelta,
        neutral: boosted === null && reduced === null,
      });
    }
  }

  if (candidates.length === 0) return null;

  // 一番 OCR EV に近い性格を採用
  candidates.sort((a, b) => a.totalDelta - b.totalDelta);
  const best = candidates[0];

  // 無補正性格はすべて効果が同じなので "まじめ" に統一
  if (best.neutral) return "まじめ";

  return best.nature;
}
