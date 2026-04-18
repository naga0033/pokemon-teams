// Google Cloud Vision API で画像のテキストを読み取る（OCR精度比較用）
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type GoogleVisionResponse = {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        blocks: Array<{
          paragraphs: Array<{
            words: Array<{
              symbols: Array<{ text: string }>;
              boundingBox: {
                vertices: Array<{ x: number; y: number }>;
              };
            }>;
          }>;
        }>;
      }>;
    };
    error?: { message: string };
  }>;
};

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_VISION_API_KEY が未設定" }, { status: 500 });
  }

  const { imageBase64, imageMediaType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 が必要" }, { status: 400 });
  }

  const mimeType = imageMediaType ?? "image/jpeg";

  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints: ["ja"] },
      },
    ],
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Google Vision API エラー: ${err}` }, { status: 502 });
  }

  const data = (await res.json()) as GoogleVisionResponse;
  const response = data.responses[0];

  if (response.error) {
    return NextResponse.json({ error: response.error.message }, { status: 502 });
  }

  const rawText = response.fullTextAnnotation?.text ?? "(テキストなし)";

  // 単語ごとの位置情報も返す（後で構造解析に使う）
  const words: Array<{ text: string; x: number; y: number }> = [];
  for (const page of response.fullTextAnnotation?.pages ?? []) {
    for (const block of page.blocks) {
      for (const para of block.paragraphs) {
        for (const word of para.words) {
          const text = word.symbols.map((s) => s.text).join("");
          const v = word.boundingBox?.vertices[0];
          if (text && v) words.push({ text, x: v.x ?? 0, y: v.y ?? 0 });
        }
      }
    }
  }

  return NextResponse.json({ rawText, words });
}
