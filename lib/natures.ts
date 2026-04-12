// ポケモンの性格 25 種リスト + バリデーション
export const NATURES: string[] = [
  "さみしがり", "いじっぱり", "やんちゃ", "ゆうかん",
  "ずぶとい", "わんぱく", "のうてんき", "のんき",
  "ひかえめ", "おっとり", "うっかりや", "れいせい",
  "おだやか", "おとなしい", "しんちょう", "なまいき",
  "おくびょう", "せっかち", "ようき", "むじゃき",
  "てれや", "がんばりや", "すなお", "きまぐれ", "まじめ",
];

const NATURE_SET = new Set(NATURES);

/** 有効な性格名かどうかチェック */
export function isValidNature(name: string): boolean {
  return NATURE_SET.has(name);
}

/** 無効な性格名を null に置換する */
export function validateNature(name: string | null | undefined): string | null {
  if (!name) return null;
  if (isValidNature(name)) return name;
  return null;
}
