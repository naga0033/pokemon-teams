// Claude Haiku Vision でポケチャンのステータス画面から実数値と努力値を読む API
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { validateNature } from "@/lib/natures";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `あなたはポケモンチャンピオンズの「ステータス確認画面」のスクリーンショットを解析するアシスタントです。

画面には 6 体のポケモンが並んでおり、各パネルには以下のステータス情報が表示されます:
- ポケモン名 (日本語)
- HP, こうげき, ぼうぎょ, とくこう, とくぼう, すばやさ の「実数値」(3桁の数字)
- 各ステータスの横にある「努力値」(オレンジ色のバーの横の数字, 0〜32の範囲)
- 性格の補正: ステータス名の横に色付きのアイコンがある
  - 赤い上向き矢印 (↑) = その能力が上がる性格補正
  - 青い下向き矢印 (↓) = その能力が下がる性格補正
  - 何もなし = 補正なし

ポケモンの性格は上がるステータスと下がるステータスの組み合わせで決まります:
- こうげき↑ とくこう↓ → いじっぱり
- こうげき↑ すばやさ↓ → ゆうかん
- こうげき↑ ぼうぎょ↓ → さみしがり
- こうげき↑ とくぼう↓ → やんちゃ
- ぼうぎょ↑ こうげき↓ → ずぶとい
- ぼうぎょ↑ すばやさ↓ → のんき
- ぼうぎょ↑ とくこう↓ → わんぱく
- ぼうぎょ↑ とくぼう↓ → のうてんき
- とくこう↑ こうげき↓ → ひかえめ
- とくこう↑ すばやさ↓ → れいせい
- とくこう↑ ぼうぎょ↓ → おっとり
- とくこう↑ とくぼう↓ → うっかりや
- とくぼう↑ こうげき↓ → おだやか
- とくぼう↑ すばやさ↓ → なまいき
- とくぼう↑ ぼうぎょ↓ → おとなしい
- とくぼう↑ とくこう↓ → しんちょう
- すばやさ↑ こうげき↓ → おくびょう
- すばやさ↑ ぼうぎょ↓ → むじゃき
- すばやさ↑ とくこう↓ → ようき
- すばやさ↑ とくぼう↓ → せっかち
- 補正なし → まじめ/がんばりや/すなお/きまぐれ/てれや のいずれか

各パネルでは、ステータス名のラベル (こうげき、ぼうぎょ等) の文字色が性格補正を示しています:
- **赤色 / オレンジ色のラベル** (🔴上向き矢印アイコン付き) = その能力が上がる性格補正
- **青色のラベル** (🔽下向き矢印アイコン付き) = その能力が下がる性格補正
- **通常色 (白/グレー) のラベル** = 補正なし

重要: HPは性格補正の対象外です。こうげき、ぼうぎょ、とくこう、とくぼう、すばやさ の5つだけ色がつきます。

入力画像を見て、スロット 1〜6 の情報を抽出し、以下の JSON 形式で返してください。
余計な説明・前置き・マークダウンコードブロックは一切含めず、純粋な JSON のみを返してください。

{
  "pokemons": [
    {
      "slot": 1,
      "name": "ポケモンの日本語名",
      "boostedStat": "赤色/オレンジ色になっているステータス名 (attack/defense/spAtk/spDef/speed のいずれか、なければ null)",
      "reducedStat": "青色になっているステータス名 (attack/defense/spAtk/spDef/speed のいずれか、なければ null)",
      "stats": {
        "hp": 175,
        "attack": 76,
        "defense": 90,
        "spAtk": 148,
        "spDef": 124,
        "speed": 187
      },
      "evs": {
        "hp": 26,
        "attack": 0,
        "defense": 3,
        "spAtk": 0,
        "spDef": 12,
        "speed": 25
      }
    }
  ]
}

注意:
- stats は各ステータスの実際の数値（3桁の大きい数字）
- evs は努力値（オレンジバーの横の小さい数字、0〜32の範囲）
- boostedStat: 赤/オレンジ色で表示されているステータス (英語キーで: attack, defense, spAtk, spDef, speed)
- reducedStat: 青色で表示されているステータス (同上)
- 色が見えない/すべて通常色の場合は boostedStat, reducedStat ともに null
- 必ず 6 体分返してください
- 読めない値は 0 にしてください`;

type RequestBody = {
  imageBase64?: string;
  imageMediaType?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません" },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  if (!body.imageBase64) {
    return NextResponse.json({ error: "imageBase64 が必要です" }, { status: 400 });
  }

  const mediaType = normalizeMediaType(body.imageMediaType);
  const client = new Anthropic({ apiKey });

  let rawText = "";
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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
              text:
                "この画像を解析して、6 体分のステータスデータを JSON 形式で返してください。\n" +
                "回答は必ず `{` から始まり `}` で終わる純粋な JSON のみにしてください。",
            },
          ],
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    rawText = block && block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("[analyze-stats] Claude API error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? `Claude API エラー: ${err.message}` : "Claude API エラー",
      },
      { status: 502 },
    );
  }

  if (!rawText) {
    return NextResponse.json({ error: "Claude から空のレスポンスが返りました" }, { status: 502 });
  }

  const jsonText = extractJson(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: "Claude の返答を JSON としてパースできませんでした", rawText },
      { status: 502 },
    );
  }

  // boostedStat/reducedStat から性格を確定 + バリデーション
  const resolved = resolveNatures(parsed);

  return NextResponse.json({ result: resolved, rawText });
}

// boostedStat + reducedStat → 性格名テーブル
const NATURE_TABLE: Record<string, Record<string, string>> = {
  attack:  { defense: "さみしがり", spAtk: "いじっぱり", spDef: "やんちゃ", speed: "ゆうかん" },
  defense: { attack: "ずぶとい", spAtk: "わんぱく", spDef: "のうてんき", speed: "のんき" },
  spAtk:   { attack: "ひかえめ", defense: "おっとり", spDef: "うっかりや", speed: "れいせい" },
  spDef:   { attack: "おだやか", defense: "おとなしい", spAtk: "しんちょう", speed: "なまいき" },
  speed:   { attack: "おくびょう", defense: "せっかち", spAtk: "ようき", spDef: "むじゃき" },
};

/** boosted/reduced から性格を確定、フォールバックで Claude の nature 値をバリデーション */
function resolveNatures(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const data = input as { pokemons?: Array<Record<string, unknown>> };
  if (!Array.isArray(data.pokemons)) return input;

  return {
    ...data,
    pokemons: data.pokemons.map((p) => {
      const boosted = typeof p.boostedStat === "string" ? p.boostedStat : null;
      const reduced = typeof p.reducedStat === "string" ? p.reducedStat : null;

      let nature: string | null = null;

      // テーブルで確定できる場合
      if (boosted && reduced && NATURE_TABLE[boosted]?.[reduced]) {
        nature = NATURE_TABLE[boosted][reduced];
      } else if (!boosted && !reduced) {
        nature = "まじめ";
      }

      // フォールバック: Claude が直接 nature を返してた場合
      if (!nature && typeof p.nature === "string") {
        nature = validateNature(p.nature);
      }

      return { ...p, nature };
    }),
  };
}

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

function extractJson(text: string): string {
  let work = text.trim();
  const fenced = work.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) work = fenced[1].trim();

  const firstBrace = work.indexOf("{");
  if (firstBrace < 0) return work;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = firstBrace; i < work.length; i++) {
    const ch = work[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end > firstBrace) return work.slice(firstBrace, end + 1);
  const lastBrace = work.lastIndexOf("}");
  if (lastBrace > firstBrace) return work.slice(firstBrace, lastBrace + 1);
  return work;
}
