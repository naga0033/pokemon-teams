// Claude Haiku Vision で構築画像を解析する API
// ポケチャンの「能力」画面のスクショから 6 体分の構築データを JSON で抽出する
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { EN_TO_JA, resolvePokemonJaName, getEnSlug } from "@/lib/pokemon-names";
import { findBestJaMatch } from "@/lib/japanese-match";
import { MOVE_NAMES_JA } from "@/lib/move-names";
import { ABILITY_NAMES_JA } from "@/lib/ability-names";
import { ITEMS } from "@/lib/items";

// マスターデータの日本語名リスト
const POKEMON_JA_LIST = Array.from(new Set(Object.values(EN_TO_JA))).filter(
  (name) => name && name.length >= 2,
);
const MOVE_JA_LIST = Array.from(new Set(Object.values(MOVE_NAMES_JA))).filter(
  (name) => name && name.length >= 2,
);
const ABILITY_JA_LIST = Array.from(new Set(Object.values(ABILITY_NAMES_JA))).filter(
  (name) => name && name.length >= 2,
);
const ITEM_JA_LIST = ITEMS.map((i) => i.ja).filter(
  (name): name is string => Boolean(name) && name.length >= 2 && !name.startsWith("もちものを選択"),
);

export const runtime = "nodejs";
export const maxDuration = 60;

// ── 技マスターをプロンプトに注入してハルシネーション/誤読を抑える ──
// 注意: 技数が多いのでここでいったん「カンマ区切り1行文字列」にする
const MOVE_MASTER_LIST = MOVE_JA_LIST.join("、");
// 特性・持ち物も同じく注入（量は技より少ない）
const ABILITY_MASTER_LIST = ABILITY_JA_LIST.join("、");
const ITEM_MASTER_LIST = ITEM_JA_LIST.join("、");

const MASTER_DATA_BLOCK = `
──────────────────────────────────────────
【厳守】 技・特性・持ち物の値は以下のマスターリストに存在する単語を優先して使用してください。
自信がある場合のみ、リストに無い値を返しても構いませんが、
その場合も下記リストの単語を優先してください。リスト内に完全一致する単語があれば必ずそれを返してください。

<技リスト>
${MOVE_MASTER_LIST}
</技リスト>

<特性リスト>
${ABILITY_MASTER_LIST}
</特性リスト>

<持ち物リスト>
${ITEM_MASTER_LIST}
</持ち物リスト>
──────────────────────────────────────────
`;

// Sonnet 向けのプロンプト: 6 体分のデータを指定 JSON 形式で返させる
const FULL_TEAM_PROMPT = `あなたはポケモンチャンピオンズ (ポケチャン) の「チーム能力確認画面」のスクリーンショットを解析するアシスタントです。
${MASTER_DATA_BLOCK}

画面には 6 体のポケモンが 2列×3行 のグリッドでパネル状に並んでいます。
スロット番号の割り当ては以下の通りです:
  左上=スロット1, 右上=スロット2
  左中=スロット3, 右中=スロット4
  左下=スロット5, 右下=スロット6
また、各パネルの右下に番号(1〜6)が表示されている場合はそれがスロット番号です。

各パネルには以下の情報が表示されます:
- ポケモンの日本語名
- 性別アイコン (♂♀、なければ不明)
- テラスタイプ (属性アイコン)
- 特性 (日本語)
- 持ち物 (日本語、アイコン付き)
- 技 4 つ (日本語、属性アイコン付き)

入力画像を見て、スロット 1〜6 の情報を抽出し、以下の JSON 形式で返してください。
余計な説明・前置き・マークダウンコードブロックは一切含めず、純粋な JSON のみを返してください。

{
  "teamTitle": "画面に表示されていればチーム名やスロット名、なければ null",
  "trainerName": "画面に表示されていればプレイヤー名、なければ null",
  "teamCode": "チームIDが表示されていればその文字列、なければ null",
  "pokemons": [
    {
      "slot": 1,
      "name": "ポケモンの日本語名 (例: カバルドン)",
      "ability": "特性 (例: すなおこし)",
      "item": "持ち物 (例: オボンのみ)",
      "teraType": "テラスタイプ (例: じめん、不明なら null)",
      "gender": "male / female / unknown のいずれか",
      "moves": ["技1", "技2", "技3", "技4"]
    }
  ]
}

- 必ず 6 体分返してください (認識できなかった場合は該当フィールドを null または空文字に)
- 技が 4 つ揃わない場合は読めた分だけ配列に入れてください
- 日本語名は公式表記に揃えてください (カタカナ)

⚠ よくある誤認識に注意:
- 技の「まもる」は全ひらがな3文字で頻出の技。4つ目の技が読めない時はまず「まもる」を疑ってください
  （プロテクトアイコン：緑色の盾マーク）
- 特性の「いかく」(Intimidate) と 技/特性の「いかり〜」系(いかりのまえば/いかりのつぼ 等) は
  別物です。「く」と「り」を絶対に取り違えないでください。
  カバルドン・ランドロス・ガオガエン・ウインディなどは特性「いかく」がほぼ確定です。`;

function getSingleSlotPrompt(slot: number) {
  return `あなたはポケモンチャンピオンズ (ポケチャン) の「チーム能力確認画面」から切り出された、1体分だけのパネル画像を解析するアシスタントです。
${MASTER_DATA_BLOCK}

この画像にはスロット ${slot} のポケモン 1 体だけが含まれています。画面内の情報を読んで、以下の JSON 形式で返してください。
余計な説明・前置き・マークダウンコードブロックは一切含めず、純粋な JSON のみを返してください。

{
  "slot": ${slot},
  "name": "ポケモンの日本語名 (例: カバルドン)",
  "ability": "特性 (例: すなおこし)",
  "item": "持ち物 (例: オボンのみ)",
  "teraType": "テラスタイプ (例: じめん、不明なら null)",
  "gender": "male / female / unknown のいずれか",
  "moves": ["技1", "技2", "技3", "技4"]
}

- この画像は1体分だけです。6体分の配列は返さないでください
- 読めない項目は null または空配列にしてください
- 技が 4 つ揃わない場合は読めた分だけ配列に入れてください
- 日本語名は公式表記に揃えてください (カタカナ)
- 不確かな場合は推測で埋めずに null を優先してください

⚠ よくある誤認識に注意:
- 技の「まもる」(全ひらがな3文字、緑盾アイコン) は頻出。4つ目の技が読めない時はまず「まもる」を疑ってください
- 特性「いかく」(Intimidate) を「いかり」と読み違えないでください。「く」と「り」は別の文字です。
  カバルドン・ランドロス・ガオガエン・ウインディなどは「いかく」がほぼ確定です。`;
}

type RequestBody = {
  imageBase64?: string;
  imageMediaType?: string; // e.g. "image/jpeg"
  slot?: number;
};

export async function POST(req: Request) {
  // ── API キーチェック ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY が設定されていません。.env.local に設定してサーバーを再起動してください。",
      },
      { status: 500 },
    );
  }

  // ── 入力を読み取り ──
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  if (!body.imageBase64) {
    return NextResponse.json(
      { error: "imageBase64 が必要です" },
      { status: 400 },
    );
  }

  // media_type の正規化
  const mediaType = normalizeMediaType(body.imageMediaType);
  const slot = Number.isInteger(body.slot) ? Number(body.slot) : null;
  const isSingleSlot = slot !== null && slot >= 1 && slot <= 6;

  // ── Claude Haiku Vision に投げる ──
  const client = new Anthropic({ apiKey });

  let rawText = "";
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: isSingleSlot ? getSingleSlotPrompt(slot) : FULL_TEAM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: body.imageBase64,
              },
            },
            {
              type: "text",
              text: isSingleSlot
                ? `この画像はスロット ${slot} の1体分だけを切り出した画像です。1体分の構築データだけを JSON 形式で返してください。\n` +
                  "回答は必ず `{` から始まり `}` で終わる純粋な JSON のみにしてください。\n" +
                  "説明文・前置き・マークダウンのコードブロック (``` で囲む等) は一切不要です。"
                : "この画像を解析して、6 体分の構築データを JSON 形式で返してください。\n" +
                  "回答は必ず `{` から始まり `}` で終わる純粋な JSON のみにしてください。\n" +
                  "説明文・前置き・マークダウンのコードブロック (``` で囲む等) は一切不要です。",
            },
          ],
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    rawText = block && block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("[analyze-team] Claude API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? `Claude API エラー: ${err.message}` : "Claude API エラー",
      },
      { status: 502 },
    );
  }

  if (!rawText) {
    return NextResponse.json(
      { error: "Claude から空のレスポンスが返りました" },
      { status: 502 },
    );
  }

  // ── 返ってきたテキストから JSON 部分を抽出してパース ──
  const jsonText = extractJson(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      {
        error: "Claude の返答を JSON としてパースできませんでした",
        rawText,
      },
      { status: 502 },
    );
  }

  // ── Claude の出力を名寄せ (OCR 的な 1 文字ズレを吸収) ──
  const normalized = isSingleSlot ? normalizeAnalyzedPokemon(parsed, slot) : normalizeAnalyzedTeam(parsed);

  return NextResponse.json({
    result: normalized,
    rawText,
  });
}

// 信頼度レベル: exact=完全一致, fuzzy=ファジーマッチ, unmatched=辞書に該当なし
type Confidence = "exact" | "fuzzy" | "unmatched";

type FieldConfidence = {
  name: Confidence;
  ability: Confidence;
  item: Confidence;
  moves: Confidence[];   // 技ごとに信頼度
  teraType: Confidence;
};

/**
 * Claude が返してきた構築データを辞書データで名寄せする。
 * - ポケモン名: resolvePokemonJaName で正式名に変換 (ひら/カナ/前方一致対応)
 * - 特性/持ち物/技: findBestJaMatch で距離1までのタイポを吸収
 * - slug: 名寄せ後のポケモン名から取得
 * - confidence: 各フィールドのマッチ信頼度を付与
 */
function normalizeAnalyzedTeam(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const team = input as {
    pokemons?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  if (!Array.isArray(team.pokemons)) return input;

  const normalizedPokemons = team.pokemons.map((p) => normalizePokemonRecord(p));

  return { ...team, pokemons: normalizedPokemons };
}

function normalizeAnalyzedPokemon(input: unknown, slot: number): unknown {
  if (!input || typeof input !== "object") return input;

  const source =
    Array.isArray((input as { pokemons?: unknown[] }).pokemons)
      ? (input as { pokemons: unknown[] }).pokemons.find((p) => {
          if (!p || typeof p !== "object") return false;
          return (p as { slot?: unknown }).slot === slot;
        }) ?? (input as { pokemons: unknown[] }).pokemons[0]
      : input;

  const normalized = normalizePokemonRecord(source);
  return { ...normalized, slot };
}

function normalizePokemonRecord(input: unknown): Record<string, unknown> {
  const p = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, unknown> = { ...p };
  const confidence: FieldConfidence = {
    name: "unmatched",
    ability: "unmatched",
    item: "unmatched",
    moves: [],
    teraType: "unmatched",
  };

  const rawAbility = typeof p.ability === "string" ? p.ability.trim() : "";
  const rawItem = typeof p.item === "string" ? p.item.trim() : "";
  const rawMoves = Array.isArray(p.moves)
    ? p.moves.filter((m): m is string => typeof m === "string").map((m) => m.trim()).filter(Boolean)
    : [];
  const rawCandidates = [rawAbility, rawItem, ...rawMoves].filter(Boolean);

  // ポケモン名の名寄せ + 信頼度
  if (typeof p.name === "string" && p.name.trim()) {
    const exactResolve = resolvePokemonJaName(p.name);
    if (exactResolve) {
      out.name = exactResolve;
      out.slug = getEnSlug(exactResolve);
      confidence.name = "exact";
    } else {
      const fuzzy = findBestJaMatch(p.name, POKEMON_JA_LIST, { maxDistance: 2 });
      if (fuzzy) {
        out.name = fuzzy;
        out.slug = getEnSlug(fuzzy);
        confidence.name = "fuzzy";
      } else {
        out.slug = null;
        confidence.name = "unmatched";
      }
    }
  }

  // テラスタイプの信頼度
  const TERA_TYPES = [
    "ノーマル", "ほのお", "みず", "でんき", "くさ", "こおり",
    "かくとう", "どく", "じめん", "ひこう", "エスパー", "むし",
    "いわ", "ゴースト", "ドラゴン", "あく", "はがね", "フェアリー", "ステラ",
  ];
  if (typeof p.teraType === "string" && p.teraType.trim()) {
    confidence.teraType = TERA_TYPES.includes(p.teraType.trim()) ? "exact" : "unmatched";
  }

  // フィールドを混同するため、全候補を集めて正しいカテゴリに振り分ける
  const allValues = rawCandidates;
  const used = new Set<string>();

  // 1. 特性を探す（全候補から）
  const abilityResult = pickBestCategorizedValueWithConfidence(allValues, ABILITY_JA_LIST, 1);
  out.ability = abilityResult?.value ?? null;
  confidence.ability = abilityResult?.confidence ?? "unmatched";
  if (abilityResult?.value) used.add(abilityResult.value);

  // 2. 持ち物を探す（特性で使った値を除外）
  const itemCandidates = allValues.filter((v) => !used.has(v));
  const itemResult = pickBestCategorizedValueWithConfidence(itemCandidates, ITEM_JA_LIST, 1);
  out.item = itemResult?.value ?? null;
  confidence.item = itemResult?.confidence ?? "unmatched";
  if (itemResult?.value) used.add(itemResult.value);

  // 3. 技を探す（特性・持ち物で使った値を除外）
  const movesResult = pickCategorizedMovesWithConfidence(allValues, used, 4);
  out.moves = movesResult.map((r) => r.value);
  confidence.moves = movesResult.map((r) => r.confidence);

  out.confidence = confidence;
  return out;
}

type MatchResult = { value: string; confidence: Confidence };

function pickBestCategorizedValueWithConfidence(
  candidates: string[],
  dictionary: string[],
  maxDistance: number,
): MatchResult | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (dictionary.includes(candidate)) return { value: candidate, confidence: "exact" };
    const fuzzy = findBestJaMatch(candidate, dictionary, { maxDistance });
    if (fuzzy) return { value: fuzzy, confidence: "fuzzy" };
  }
  return null;
}

function pickCategorizedMovesWithConfidence(
  candidates: string[],
  reserved: Set<string>,
  limit: number,
): MatchResult[] {
  const moves: MatchResult[] = [];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (MOVE_JA_LIST.includes(candidate)) {
      if (reserved.has(candidate)) continue;
      if (moves.some((m) => m.value === candidate)) continue;
      moves.push({ value: candidate, confidence: "exact" });
    } else {
      const fuzzy = findBestJaMatch(candidate, MOVE_JA_LIST, { maxDistance: 2 });
      if (!fuzzy) continue;
      if (reserved.has(fuzzy)) continue;
      if (moves.some((m) => m.value === fuzzy)) continue;
      moves.push({ value: fuzzy, confidence: "fuzzy" });
    }
    if (moves.length >= limit) break;
  }

  return moves;
}

/** MIME type 正規化 (Claude API が受け付ける形に) */
function normalizeMediaType(
  raw?: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (!raw) return "image/jpeg";
  const lower = raw.toLowerCase();
  if (lower.includes("png")) return "image/png";
  if (lower.includes("gif")) return "image/gif";
  if (lower.includes("webp")) return "image/webp";
  return "image/jpeg";
}

/** Claude が JSON の前後にテキストをつけてしまう場合に備え、{...} 部分だけ抜く */
function extractJson(text: string): string {
  let work = text.trim();

  // マークダウンコードブロックを剥がす
  const fenced = work.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    work = fenced[1].trim();
  }

  // 最初の { から、対応する括弧を追跡して閉じる位置を探す
  const firstBrace = work.indexOf("{");
  if (firstBrace < 0) return work;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = firstBrace; i < work.length; i++) {
    const ch = work[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end > firstBrace) {
    return work.slice(firstBrace, end + 1);
  }
  // 閉じ括弧が見つからない → 最後の } までを返す (切り詰めで壊れた場合の最終手段)
  const lastBrace = work.lastIndexOf("}");
  if (lastBrace > firstBrace) {
    return work.slice(firstBrace, lastBrace + 1);
  }
  return work;
}
