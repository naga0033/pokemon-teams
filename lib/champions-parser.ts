// ポケモンチャンピオンズ「能力」画面のスクショから構築データを抽出するパーサー
// Tesseract で OCR した生テキストを6体分の構造化データに落とす
import { MOVE_NAMES_JA } from "./move-names";
import { ABILITY_NAMES_JA } from "./ability-names";
import { ITEMS } from "./items";
import { resolvePokemonJaName, getEnSlug } from "./pokemon-names";
import { findBestJaMatch, normalizeJaText } from "./japanese-match";
import type { PokemonSlot } from "./types";

// マスターリストを日本語名だけの配列に変換 (重複除去 + 長さで並べ替え)
const MOVE_JA_LIST: string[] = Array.from(new Set(Object.values(MOVE_NAMES_JA))).filter(
  (name) => name && name.length >= 2,
);

const ABILITY_JA_LIST: string[] = Array.from(new Set(Object.values(ABILITY_NAMES_JA))).filter(
  (name) => name && name.length >= 2,
);

const ITEM_JA_LIST: string[] = ITEMS.map((item) => item.ja).filter(
  (name): name is string => Boolean(name) && name.length >= 2 && !name.startsWith("もちものを選択"),
);

// 検索高速化のため正規化済みインデックス
type NameIndex = Array<{ ja: string; normalized: string }>;
function buildIndex(list: string[]): NameIndex {
  return list.map((ja) => ({ ja, normalized: normalizeJaText(ja) }));
}
const MOVE_INDEX = buildIndex(MOVE_JA_LIST);
const ABILITY_INDEX = buildIndex(ABILITY_JA_LIST);
const ITEM_INDEX = buildIndex(ITEM_JA_LIST);

// 1ボックス分のパース結果
export type ParsedBox = {
  /** 最終決定した日本語ポケモン名 (マスターで名寄せ済) */
  name: string | null;
  /** 英語 slug (画像パス解決用) */
  slug: string | null;
  /** 特性 */
  ability: string | null;
  /** 持ち物 */
  item: string | null;
  /** 技 4 つまで */
  moves: string[];
  /** OCR で得られた生テキスト (デバッグ用) */
  rawText: string;
  /** どの行も当てられなかった行 (デバッグ用) */
  unmatchedLines: string[];
};

/** 生の1ボックス分テキストを解析する */
export function parseBoxText(rawText: string): ParsedBox {
  const lines = rawText
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, "").trim())
    .filter(Boolean);

  let name: string | null = null;
  let slug: string | null = null;
  let ability: string | null = null;
  let item: string | null = null;
  const moves: string[] = [];
  const unmatchedLines: string[] = [];

  for (const rawLine of lines) {
    // 装飾文字 (数字のみ、アイコン記号) は捨てる
    if (/^[0-9０-９\s\-・●◎○]+$/.test(rawLine)) continue;
    if (rawLine.length < 2) continue;

    // ── 1. ポケモン名 (まだ決まってない時だけ試す) ──
    if (!name) {
      const resolved = resolvePokemonJaName(rawLine);
      if (resolved) {
        name = resolved;
        slug = getEnSlug(resolved);
        continue;
      }
    }

    // ── 2. 技の完全一致 ──
    const moveExact = matchExact(rawLine, MOVE_INDEX);
    if (moveExact && moves.length < 4 && !moves.includes(moveExact)) {
      moves.push(moveExact);
      continue;
    }

    // ── 3. 特性の完全一致 ──
    if (!ability) {
      const abilityExact = matchExact(rawLine, ABILITY_INDEX);
      if (abilityExact) {
        ability = abilityExact;
        continue;
      }
    }

    // ── 4. 持ち物の完全一致 ──
    if (!item) {
      const itemExact = matchExact(rawLine, ITEM_INDEX);
      if (itemExact) {
        item = itemExact;
        continue;
      }
    }

    // ── 5. ファジーマッチ: 技 (距離1) ──
    if (moves.length < 4) {
      const fuzzyMove = findBestJaMatch(rawLine, MOVE_JA_LIST, { maxDistance: 1 });
      if (fuzzyMove && !moves.includes(fuzzyMove)) {
        moves.push(fuzzyMove);
        continue;
      }
    }

    // ── 6. ファジーマッチ: 特性 ──
    if (!ability) {
      const fuzzyAbility = findBestJaMatch(rawLine, ABILITY_JA_LIST, { maxDistance: 1 });
      if (fuzzyAbility) {
        ability = fuzzyAbility;
        continue;
      }
    }

    // ── 7. ファジーマッチ: 持ち物 ──
    if (!item) {
      const fuzzyItem = findBestJaMatch(rawLine, ITEM_JA_LIST, { maxDistance: 1 });
      if (fuzzyItem) {
        item = fuzzyItem;
        continue;
      }
    }

    unmatchedLines.push(rawLine);
  }

  // ── Phase 2: まだ名前が決まってない場合、全テキスト横断でポケモン名を探す ──
  if (!name) {
    const fullText = lines.join("");
    const resolved = resolvePokemonJaName(fullText);
    if (resolved) {
      name = resolved;
      slug = getEnSlug(resolved);
    } else {
      // もっと緩く: 各行のプレフィックスを試す
      for (const line of lines) {
        for (let len = Math.min(line.length, 10); len >= 3; len--) {
          const prefix = line.slice(0, len);
          const maybeName = resolvePokemonJaName(prefix);
          if (maybeName) {
            name = maybeName;
            slug = getEnSlug(maybeName);
            break;
          }
        }
        if (name) break;
      }
    }
  }

  // ── Phase 3: 技の追加スキャン (マスターの長い名前から順に全文照合) ──
  if (moves.length < 4) {
    const fullText = lines.join("/");
    const sortedMoves = [...MOVE_JA_LIST].sort((a, b) => b.length - a.length);
    for (const move of sortedMoves) {
      if (moves.length >= 4) break;
      if (fullText.includes(move) && !moves.includes(move)) {
        moves.push(move);
      }
    }
  }

  return {
    name,
    slug,
    ability,
    item,
    moves,
    rawText,
    unmatchedLines,
  };
}

/**
 * 完全一致マッチング (正規化した上で)
 * OCR の結果と辞書エントリが正規化後に等しい場合だけヒット
 */
function matchExact(line: string, index: NameIndex): string | null {
  const normalized = normalizeJaText(line);
  for (const entry of index) {
    if (entry.normalized === normalized) return entry.ja;
  }
  return null;
}

/** パース結果を PokemonSlot 型に変換 (name/slug 未定でも強制変換) */
export function parsedBoxToSlot(box: ParsedBox): PokemonSlot {
  return {
    name: box.name ?? "(名前未取得)",
    slug: box.slug ?? "unknown",
    ability: box.ability ?? undefined,
    item: box.item ?? undefined,
    moves: box.moves,
  };
}

/** パース結果の充填度 (デバッグ用) */
export function boxFilledCount(box: ParsedBox): number {
  let count = 0;
  if (box.name) count++;
  if (box.ability) count++;
  if (box.item) count++;
  count += Math.min(box.moves.length, 4);
  return count;
}
