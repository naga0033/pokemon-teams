// Google Cloud Vision API でポケモン構築画面を解析する完全パイプライン
// 位置情報 + 辞書マッチで、Claudeなしにポケモン名・技・特性・持ち物を構造化する
import { NextResponse } from "next/server";
import { EN_TO_JA, resolvePokemonJaName, getEnSlug } from "@/lib/pokemon-names";
import { findBestJaMatch } from "@/lib/japanese-match";
import { MOVE_NAMES_JA } from "@/lib/move-names";
import { ABILITY_NAMES_JA } from "@/lib/ability-names";
import { ITEMS } from "@/lib/items";
import { fetchBaseStats } from "@/lib/pokeapi-stats";
import { inferNature } from "@/lib/nature-calc";

export const runtime = "nodejs";
export const maxDuration = 30;

const POKEMON_JA_LIST = Array.from(new Set(Object.values(EN_TO_JA))).filter((n) => n && n.length >= 2);
const MOVE_JA_LIST = Array.from(new Set(Object.values(MOVE_NAMES_JA))).filter((n) => n && n.length >= 2);
const ABILITY_JA_LIST = Array.from(new Set(Object.values(ABILITY_NAMES_JA))).filter((n) => n && n.length >= 2);
const ITEM_JA_LIST = ITEMS.map((i) => i.ja).filter((n): n is string => Boolean(n) && n.length >= 2);

type Word = { text: string; x: number; y: number; w: number; h: number };

type GVisionResponse = {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        width: number;
        height: number;
        blocks: Array<{
          paragraphs: Array<{
            words: Array<{
              symbols: Array<{ text: string }>;
              boundingBox: { vertices: Array<{ x?: number; y?: number }> };
            }>;
          }>;
        }>;
      }>;
    };
    error?: { message: string };
  }>;
};

/** Google Vision API を叩いて単語リストを返す */
async function callGoogleVision(base64: string, mimeType: string, apiKey: string): Promise<{ words: Word[]; rawText: string; imageW: number; imageH: number }> {
  const body = {
    requests: [{
      image: { content: base64 },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      imageContext: { languageHints: ["ja"] },
    }],
  };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Google Vision HTTP ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as GVisionResponse;
  const response = data.responses[0];
  if (response.error) throw new Error(response.error.message);

  const page = response.fullTextAnnotation?.pages[0];
  const imageW = page?.width ?? 1000;
  const imageH = page?.height ?? 1000;
  const rawText = response.fullTextAnnotation?.text ?? "";

  const words: Word[] = [];
  for (const block of page?.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const word of para.words) {
        const text = word.symbols.map((s) => s.text).join("");
        const v = word.boundingBox?.vertices ?? [];
        const xs = v.map((p) => p.x ?? 0);
        const ys = v.map((p) => p.y ?? 0);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const w = Math.max(...xs) - x;
        const h = Math.max(...ys) - y;
        if (text.trim()) words.push({ text: text.trim(), x, y, w, h });
      }
    }
  }

  return { words, rawText, imageW, imageH };
}

/** 辞書マッチでカテゴリを判定 */
type Category = "pokemon" | "move" | "ability" | "item" | "unknown";

function classify(raw: string): { category: Category; normalized: string; confidence: "exact" | "fuzzy" | "none" } {
  // 先頭の選択マーカー（○ ◆ • ● 等）とスペースを剥がしてから辞書マッチ
  const text = raw.replace(/^[○◯◆◇●・•\s]+/, "").trim();
  if (text.length < 2) return { category: "unknown", normalized: raw, confidence: "none" };

  // 完全一致を持ち物→技→特性の順で先にチェック（ポケモン名の前方一致誤検出を防ぐ）
  if (ITEM_JA_LIST.includes(text)) return { category: "item", normalized: text, confidence: "exact" };
  if (MOVE_JA_LIST.includes(text)) return { category: "move", normalized: text, confidence: "exact" };
  if (ABILITY_JA_LIST.includes(text)) return { category: "ability", normalized: text, confidence: "exact" };

  // ポケモン名: resolvePokemonJaName は内部で fuzzy 一致も返す（例: とくこう→ライコウ）ため
  // 「入力が正規化名に含まれるか / 正規化名が入力に含まれる」形式のみ exact として扱う
  const pokemonExact = resolvePokemonJaName(text);
  if (pokemonExact && text.length >= 3) {
    const containsOrContained = pokemonExact.includes(text) || text.includes(pokemonExact);
    if (containsOrContained) {
      return { category: "pokemon", normalized: pokemonExact, confidence: "exact" };
    }
  }

  // ファジーマッチ（持ち物→技→特性→ポケモン名の順）
  const fuzzyItem = findBestJaMatch(text, ITEM_JA_LIST, { maxDistance: 1 });
  if (fuzzyItem) return { category: "item", normalized: fuzzyItem, confidence: "fuzzy" };

  const fuzzyMove = findBestJaMatch(text, MOVE_JA_LIST, { maxDistance: 1 });
  if (fuzzyMove) return { category: "move", normalized: fuzzyMove, confidence: "fuzzy" };

  const fuzzyAbility = findBestJaMatch(text, ABILITY_JA_LIST, { maxDistance: 1 });
  if (fuzzyAbility) return { category: "ability", normalized: fuzzyAbility, confidence: "fuzzy" };

  // ポケモン名のファジー: 3文字未満は誤検出が多いので除外、長さ差も厳しめに
  if (text.length >= 3) {
    const fuzzyPoke = findBestJaMatch(text, POKEMON_JA_LIST, { maxDistance: 1 });
    if (fuzzyPoke && Math.abs(text.length - fuzzyPoke.length) <= 1) {
      return { category: "pokemon", normalized: fuzzyPoke, confidence: "fuzzy" };
    }
  }

  return { category: "unknown", normalized: raw, confidence: "none" };
}

// ノイズとして無視するヘッダー系の単語パターン
const HEADER_PATTERNS = [
  /^スロット/, /^チームID/, /^チームid/i, /^能力$/, /^ステータス$/, /^[RLMF]$/, /^\d+$/, /^[a-zA-Z]{1,3}$/,
  /^K[A-Z0-9]{7,}$/, // チームIDの英数字部分
];

function isNoise(text: string): boolean {
  return HEADER_PATTERNS.some((p) => p.test(text.trim()));
}

type MergedToken = { text: string; x: number; y: number };

/**
 * Google Vision が返す単語フラグメント（「せいぎ」「の」「こころ」のように分割される）を
 * 同じ行・近接x で結合してトークン化する。
 */
// 非テキスト系の記号（アイコンや矢印のOCR化け）は結合対象から除外する
function isSymbolOnly(text: string): boolean {
  return /^[*©®°◆◇○◯●・•#※†‡!?@$%^&~`|\\/<>=+\-_\[\]{}'"]+$/.test(text);
}

function mergeWordFragments(words: Word[]): MergedToken[] {
  if (words.length === 0) return [];
  // 記号のみのトークンは事前に除外
  const sorted = [...words]
    .filter((w) => !isSymbolOnly(w.text))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  // y-band で行グルーピング（中心y差 < 行高の半分）
  const lines: Word[][] = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    const centerY = w.y + w.h / 2;
    if (last) {
      const lastCenterY = last[0].y + last[0].h / 2;
      if (Math.abs(centerY - lastCenterY) < Math.max(w.h, last[0].h) * 0.6) {
        last.push(w);
        continue;
      }
    }
    lines.push([w]);
  }

  const tokens: MergedToken[] = [];
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
    let cur = { text: line[0].text, x: line[0].x, y: line[0].y, endX: line[0].x + line[0].w, h: line[0].h };
    for (let i = 1; i < line.length; i++) {
      const w = line[i];
      // 隣接していれば結合（文字高の 0.8 以内なら同一トークン）
      // アイコン等は h が大きすぎるので 30px でクランプ
      const mergeThreshold = Math.min(cur.h, w.h, 30) * 0.8;
      if (w.x - cur.endX < mergeThreshold) {
        cur.text += w.text;
        cur.endX = w.x + w.w;
      } else {
        tokens.push({ text: cur.text, x: cur.x, y: cur.y });
        cur = { text: w.text, x: w.x, y: w.y, endX: w.x + w.w, h: w.h };
      }
    }
    tokens.push({ text: cur.text, x: cur.x, y: cur.y });
  }
  return tokens;
}

/**
 * 位置ベースで 6スロット（2列 × 3行）に振り分ける。
 * 1. ポケモン名として classify されたトークンをアンカーとして y-band を確定
 * 2. 各トークンを (最近傍y行) × (x左右) で 1〜6 のスロットに割り当て
 * 3. 各スロット内で ability/item/moves を辞書マッチで充填
 */
function parseByPosition(words: Word[], imageW: number): Array<{
  slot: number;
  name: string | null;
  slug: string | null;
  ability: string | null;
  item: string | null;
  teraType: null;
  gender: "unknown";
  moves: Array<string | null>;
}> {
  const tokens = mergeWordFragments(words).filter(
    (t) => t.text.length >= 2 && !isNoise(t.text),
  );

  // ポケモン名アンカー（完全一致優先、ファジーは後回し）
  const pokemonAnchors: Array<{ name: string; x: number; y: number }> = [];
  for (const t of tokens) {
    const c = classify(t.text);
    if (c.category === "pokemon" && c.confidence === "exact") {
      pokemonAnchors.push({ name: c.normalized, x: t.x, y: t.y });
    }
  }
  // 足りない場合はファジーも採用
  if (pokemonAnchors.length < 6) {
    for (const t of tokens) {
      const c = classify(t.text);
      if (c.category === "pokemon" && c.confidence === "fuzzy") {
        if (!pokemonAnchors.some((a) => Math.abs(a.y - t.y) < 30 && Math.abs(a.x - t.x) < 50)) {
          pokemonAnchors.push({ name: c.normalized, x: t.x, y: t.y });
        }
      }
    }
  }

  // y でソートし、3行バンドにクラスタリング
  pokemonAnchors.sort((a, b) => a.y - b.y);
  const rowBands: Array<{ yMin: number; yMax: number; yCenter: number; anchors: typeof pokemonAnchors }> = [];
  for (const a of pokemonAnchors) {
    const band = rowBands.find((b) => Math.abs(b.yCenter - a.y) < 80);
    if (band) {
      band.anchors.push(a);
      band.yMin = Math.min(band.yMin, a.y);
      band.yMax = Math.max(band.yMax, a.y);
      band.yCenter = (band.yMin + band.yMax) / 2;
    } else {
      rowBands.push({ yMin: a.y, yMax: a.y, yCenter: a.y, anchors: [a] });
    }
  }
  rowBands.sort((a, b) => a.yCenter - b.yCenter);

  // x 中線（左/右カラム境界）
  const midX = imageW / 2;

  // 6スロット作成（row 0/1/2, col left/right）
  type Slot = {
    idx: number;
    name: string | null;
    yCenter: number;
    xIsLeft: boolean;
    ability: string | null;
    item: string | null;
    moves: string[];
  };
  const slots: Slot[] = [];
  for (let row = 0; row < rowBands.length; row++) {
    const band = rowBands[row];
    const leftAnchor = band.anchors.find((a) => a.x < midX);
    const rightAnchor = band.anchors.find((a) => a.x >= midX);
    slots.push({
      idx: row * 2 + 1,
      name: leftAnchor?.name ?? null,
      yCenter: band.yCenter,
      xIsLeft: true,
      ability: null,
      item: null,
      moves: [],
    });
    slots.push({
      idx: row * 2 + 2,
      name: rightAnchor?.name ?? null,
      yCenter: band.yCenter,
      xIsLeft: false,
      ability: null,
      item: null,
      moves: [],
    });
  }

  // 各トークンを最近傍スロットへ割り当て、辞書マッチ
  for (const t of tokens) {
    const c = classify(t.text);
    if (c.category === "unknown") continue;
    if (c.category === "pokemon") continue; // アンカーとして既に処理済み

    // 行帯を「自行名前 〜 次行名前」で区切って割り当て
    // 技は名前より下に並ぶが、次の名前より上までが所属範囲
    let bestRow = 0;
    for (let row = 0; row < rowBands.length; row++) {
      const nextCenter = rowBands[row + 1]?.yCenter ?? Infinity;
      // 自行の yCenter 以上、次行の yCenter 未満ならこの行
      if (t.y < nextCenter - 10) {
        bestRow = row;
        break;
      }
    }
    // 最終行より下に来てしまったら最終行
    if (t.y >= (rowBands[rowBands.length - 1]?.yCenter ?? 0)) {
      // 最終行以降のトークンは最終行扱い（ただし最終行の上端より上は上位行）
      for (let row = rowBands.length - 1; row >= 0; row--) {
        if (t.y >= rowBands[row].yCenter - 20) {
          bestRow = row;
          break;
        }
      }
    }
    // 次の行との距離があまりに近い場合（境界上）は位置での判定に任せる
    const isLeft = t.x < midX;
    const slotIdx = bestRow * 2 + (isLeft ? 0 : 1);
    const slot = slots[slotIdx];
    if (!slot) continue;

    if (c.category === "ability" && !slot.ability) slot.ability = c.normalized;
    else if (c.category === "item" && !slot.item) slot.item = c.normalized;
    else if (c.category === "move" && slot.moves.length < 4 && !slot.moves.includes(c.normalized)) {
      slot.moves.push(c.normalized);
    }
  }

  return slots
    .filter((s) => s.name) // ポケモンが居ないスロットは出力しない
    .map((s) => ({
      slot: s.idx,
      name: s.name,
      slug: s.name ? getEnSlug(s.name) : null,
      ability: s.ability,
      item: s.item,
      teraType: null as null,
      gender: "unknown" as const,
      moves: [
        s.moves[0] ?? null,
        s.moves[1] ?? null,
        s.moves[2] ?? null,
        s.moves[3] ?? null,
      ],
    }));
}

// ===== ステータス画面パーサー =====

type StatKey = "hp" | "attack" | "defense" | "spAtk" | "spDef" | "speed";
type StatRow = { actual: number | null; ev: number | null };
type StatSet = Record<StatKey, StatRow>;

const STAT_LABELS: Array<{ label: string; key: StatKey }> = [
  { label: "HP", key: "hp" },
  { label: "こうげき", key: "attack" },
  { label: "ぼうぎょ", key: "defense" },
  { label: "とくこう", key: "spAtk" },
  { label: "とくぼう", key: "spDef" },
  { label: "すばやさ", key: "speed" },
];

function emptyStats(): StatSet {
  return {
    hp: { actual: null, ev: null },
    attack: { actual: null, ev: null },
    defense: { actual: null, ev: null },
    spAtk: { actual: null, ev: null },
    spDef: { actual: null, ev: null },
    speed: { actual: null, ev: null },
  };
}

/**
 * 1ポケモン分の矩形領域から 6ステータス × (実数値, 努力値) を抽出する。
 * 各ステータス行は `ラベル  実数値  ―  努力値` の並びで、行内の digit トークンを左→右で読む。
 */
function extractStatsFromBox(tokens: MergedToken[]): StatSet {
  const result = emptyStats();
  for (const { label, key } of STAT_LABELS) {
    const labelToken = tokens.find((t) => t.text === label);
    if (!labelToken) continue;

    // 同じ y-band (±25px)、ラベルより右で subcol 幅以内の digit トークンを集める
    const sameRow = tokens
      .filter(
        (t) =>
          Math.abs(t.y - labelToken.y) < 25 &&
          t.x > labelToken.x + 20 &&
          t.x < labelToken.x + 320 &&
          /^\d+$/.test(t.text),
      )
      .sort((a, b) => a.x - b.x);

    if (sameRow.length >= 2) {
      result[key] = {
        actual: parseInt(sameRow[0].text, 10),
        ev: parseInt(sameRow[sameRow.length - 1].text, 10),
      };
    } else if (sameRow.length === 1) {
      // 努力値が検出できない場合は 0 とみなす（OCR で "0" が "O" に化ける等）
      result[key] = { actual: parseInt(sameRow[0].text, 10), ev: 0 };
    }
  }
  return result;
}

type StatusSlot = {
  slot: number;
  name: string | null;
  slug: string | null;
  stats: StatSet;
  nature: string | null;
};

async function parseStatusScreen(words: Word[], imageW: number): Promise<StatusSlot[]> {
  const tokens = mergeWordFragments(words);
  const midX = imageW / 2;

  // ポケモン名アンカー（exact 優先、不足ならファジー）
  const anchors: Array<{ name: string; x: number; y: number }> = [];
  for (const t of tokens.filter((t) => t.text.length >= 2 && !isNoise(t.text))) {
    const c = classify(t.text);
    if (c.category === "pokemon" && c.confidence === "exact") {
      anchors.push({ name: c.normalized, x: t.x, y: t.y });
    }
  }
  if (anchors.length < 6) {
    for (const t of tokens) {
      const c = classify(t.text);
      if (c.category === "pokemon" && c.confidence === "fuzzy") {
        if (!anchors.some((a) => Math.abs(a.y - t.y) < 30 && Math.abs(a.x - t.x) < 50)) {
          anchors.push({ name: c.normalized, x: t.x, y: t.y });
        }
      }
    }
  }

  // y-band で 3 行にクラスタリング
  anchors.sort((a, b) => a.y - b.y);
  const rowBands: Array<{ yCenter: number; anchors: typeof anchors }> = [];
  for (const a of anchors) {
    const band = rowBands.find((b) => Math.abs(b.yCenter - a.y) < 80);
    if (band) {
      band.anchors.push(a);
      band.yCenter = (band.yCenter + a.y) / 2;
    } else {
      rowBands.push({ yCenter: a.y, anchors: [a] });
    }
  }
  rowBands.sort((a, b) => a.yCenter - b.yCenter);

  // 各スロットの矩形を作り、stat を抽出
  const slots: StatusSlot[] = [];
  for (let row = 0; row < rowBands.length; row++) {
    const band = rowBands[row];
    const leftAnchor = band.anchors.find((a) => a.x < midX);
    const rightAnchor = band.anchors.find((a) => a.x >= midX);

    for (const [sub, anchor] of [
      [0, leftAnchor],
      [1, rightAnchor],
    ] as const) {
      const idx = row * 2 + sub + 1;
      if (!anchor) continue;

      const bboxLeft = sub === 0 ? 0 : midX;
      const bboxRight = sub === 0 ? midX : imageW;
      const bboxTop = anchor.y - 10;
      const bboxBottom = (rowBands[row + 1]?.yCenter ?? Infinity) - 10;

      const inBox = tokens.filter(
        (t) => t.x >= bboxLeft && t.x < bboxRight && t.y >= bboxTop && t.y < bboxBottom,
      );

      const stats = extractStatsFromBox(inBox);
      slots.push({
        slot: idx,
        name: anchor.name,
        slug: getEnSlug(anchor.name),
        stats,
        nature: null,
      });
    }
  }

  // 種族値を並列取得し、性格を逆算
  await Promise.all(
    slots.map(async (s) => {
      if (!s.slug) return;
      const base = await fetchBaseStats(s.slug);
      if (!base) return;
      // nature-calc の期待形式に整形
      const baseForCalc = {
        hp: base.hp,
        attack: base.atk,
        defense: base.def,
        spAtk: base.spAtk,
        spDef: base.spDef,
        speed: base.speed,
      };
      const actuals: Record<string, number | undefined> = {};
      const evs: Record<string, number | undefined> = {};
      (Object.keys(s.stats) as StatKey[]).forEach((k) => {
        if (s.stats[k].actual != null) actuals[k] = s.stats[k].actual!;
        if (s.stats[k].ev != null) evs[k] = s.stats[k].ev!;
      });
      s.nature = inferNature(baseForCalc, actuals, evs);
    }),
  );

  return slots;
}

/** 画面タイプ自動判定 */
function detectScreenType(words: Word[]): "ability" | "status" | "unknown" {
  const tokens = mergeWordFragments(words);
  const texts = new Set(tokens.map((t) => t.text));
  const statLabelCount = STAT_LABELS.filter((s) => texts.has(s.label)).length;
  if (statLabelCount >= 3) return "status";
  // 能力画面は技・特性・持ち物が多数出るので、それらを数える
  let abilityHitCount = 0;
  for (const t of tokens) {
    const c = classify(t.text);
    if (c.confidence === "exact" && (c.category === "move" || c.category === "ability" || c.category === "item")) {
      abilityHitCount++;
      if (abilityHitCount >= 6) return "ability";
    }
  }
  return "unknown";
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_VISION_API_KEY が未設定" }, { status: 500 });

  const { imageBase64, imageMediaType } = await req.json();
  if (!imageBase64) return NextResponse.json({ error: "imageBase64 が必要" }, { status: 400 });

  try {
    const { words, rawText, imageW } = await callGoogleVision(imageBase64, imageMediaType ?? "image/jpeg", apiKey);

    const screenType = detectScreenType(words);

    if (screenType === "status") {
      const statusSlots = await parseStatusScreen(words, imageW);
      // デバッグ: マージトークンとアンカー検出状況
      const merged = mergeWordFragments(words);
      return NextResponse.json({
        screenType,
        result: { statusSlots },
        rawText,
        wordCount: words.length,
      });
    }

    // デフォルト: 能力画面
    const pokemons = parseByPosition(words, imageW);
    return NextResponse.json({
      screenType,
      result: { pokemons, teamTitle: null, trainerName: null, teamCode: null, rating: null },
      rawText,
      wordCount: words.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "エラー" },
      { status: 502 },
    );
  }
}
