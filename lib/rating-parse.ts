// ツイート本文からポケモン対戦のレートを抽出するユーティリティ
// 例:
//   "最終2048.5" → 2048.5
//   "レート 2156" → 2156
//   "最終レート1900" → 1900
//   "R2100達成" → 2100
//   "2048達成" → 2048
//   "1位 2156.4" → 2156.4

/** ツイート本文からレートっぽい数値を抽出。見つからなければ null */
export function parseRatingFromText(text: string | undefined | null): number | null {
  if (!text) return null;

  // 全角数字を半角に正規化
  const normalized = text.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );

  const patterns: RegExp[] = [
    // 「レート 2048.5」「レート:2048」
    /レート\s*[:：]?\s*(\d{4}(?:\.\d+)?)/,
    // 「最終レート 2048.5」「最終2048」
    /最終\s*(?:レート)?\s*[:：]?\s*(\d{4}(?:\.\d+)?)/,
    // 「R2100」(前後に数字/英字がない単独の R)
    /(?:^|[^a-zA-Z0-9])R\s*(\d{4}(?:\.\d+)?)/,
    // 「2048.5 達成」「2100達成」
    /(\d{4}(?:\.\d+)?)\s*(?:達成|到達)/,
    // 「○位 2156.4」(順位の直後の4桁数字)
    /\d+\s*位[^\d]{0,8}(\d{4}(?:\.\d+)?)/,
  ];

  const candidates: number[] = [];
  for (const re of patterns) {
    const m = normalized.match(re);
    if (m) {
      const v = Number.parseFloat(m[1]);
      if (Number.isFinite(v) && v >= 1000 && v <= 3000) {
        candidates.push(v);
      }
    }
  }

  if (candidates.length === 0) return null;
  // 複数マッチした場合は最大値を採用 (「最終2048.5 / 最高2100」なら 2100 を採用)
  return Math.max(...candidates);
}
