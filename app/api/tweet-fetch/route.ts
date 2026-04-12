// ツイート取得 API
// クライアントから受け取ったツイートURL を fxtwitter.com 経由で解決し、
// 画像を base64 dataUrl に変換して返す (CORS 回避のため画像もサーバーでプロキシ)
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** ツイートURL 文字列からツイートID を抽出 */
function extractTweetId(url: string): string | null {
  const match = url.match(
    /(?:x|twitter|fixupx|fxtwitter|vxtwitter)\.com\/[^/]+\/status(?:es)?\/(\d+)/i,
  );
  return match?.[1] ?? null;
}

type FxAuthor = {
  name?: string;
  screen_name?: string;
};

type FxPhoto = {
  type?: string;
  url?: string;
  width?: number;
  height?: number;
};

type FxTweet = {
  url?: string;
  id?: string;
  text?: string;
  author?: FxAuthor;
  media?: {
    all?: FxPhoto[];
    photos?: FxPhoto[];
  };
};

type FxResponse = {
  code?: number;
  message?: string;
  tweet?: FxTweet;
};

export async function POST(req: Request) {
  // ── 入力を読み取り ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON の解析に失敗しました" }, { status: 400 });
  }

  const rawUrl =
    typeof (body as { url?: unknown })?.url === "string"
      ? ((body as { url: string }).url).trim()
      : "";
  if (!rawUrl) {
    return NextResponse.json({ error: "ツイートURL を指定してください" }, { status: 400 });
  }

  const tweetId = extractTweetId(rawUrl);
  if (!tweetId) {
    return NextResponse.json(
      { error: "ツイートURL として認識できませんでした (x.com / twitter.com のリンクを貼ってください)" },
      { status: 400 },
    );
  }

  // ── fxtwitter からメタデータ取得 ──
  let fxData: FxResponse;
  try {
    const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: { "User-Agent": "PokeChampDeck/1.0 (ingest)" },
      cache: "no-store",
    });
    if (!fxRes.ok) {
      return NextResponse.json(
        { error: `ツイート取得失敗 (fxtwitter: ${fxRes.status})` },
        { status: 502 },
      );
    }
    fxData = (await fxRes.json()) as FxResponse;
  } catch {
    return NextResponse.json(
      { error: "ツイート取得中にネットワークエラーが発生しました" },
      { status: 502 },
    );
  }

  const tweet = fxData.tweet;
  if (!tweet) {
    return NextResponse.json(
      { error: "ツイートが見つかりませんでした (非公開・削除済みの可能性)" },
      { status: 404 },
    );
  }

  // ── 画像を抽出 ──
  const photos: FxPhoto[] =
    tweet.media?.photos ??
    tweet.media?.all?.filter((m) => m.type === "photo") ??
    [];

  const photoUrls = photos
    .map((p) => p.url)
    .filter((url): url is string => Boolean(url));

  if (photoUrls.length === 0) {
    return NextResponse.json(
      { error: "ツイートに画像がありません" },
      { status: 400 },
    );
  }

  // ── 画像をダウンロードして base64 dataUrl に変換 ──
  const images = await Promise.all(
    photoUrls.map(async (photoUrl) => {
      try {
        const imgRes = await fetch(photoUrl, { cache: "no-store" });
        if (!imgRes.ok) return null;
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
        return {
          sourceUrl: photoUrl,
          dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        };
      } catch {
        return null;
      }
    }),
  );

  const validImages = images.filter(
    (img): img is { sourceUrl: string; dataUrl: string } => img !== null,
  );

  if (validImages.length === 0) {
    return NextResponse.json(
      { error: "画像のダウンロードに失敗しました" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    tweetId,
    tweetUrl: `https://x.com/${tweet.author?.screen_name ?? "_"}/status/${tweetId}`,
    text: tweet.text ?? "",
    author: {
      name: tweet.author?.name ?? "",
      screenName: tweet.author?.screen_name ?? "",
    },
    images: validImages,
  });
}
