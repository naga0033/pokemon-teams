"use client";

// Google Cloud Vision vs Claude Vision 精度比較テストページ
import { useState } from "react";

type GoogleRawResult = { rawText?: string; error?: string };
type GoogleParsedResult = { result?: unknown; rawText?: string; wordCount?: number; error?: string };
type ClaudeResult = { result?: unknown; rawText?: string; error?: string };

type TweetImage = { sourceUrl: string; dataUrl: string };

export default function OcrTestPage() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [googleRaw, setGoogleRaw] = useState<GoogleRawResult | null>(null);
  const [googleRawMs, setGoogleRawMs] = useState<number | null>(null);
  const [googleParsed, setGoogleParsed] = useState<GoogleParsedResult | null>(null);
  const [googleParsedMs, setGoogleParsedMs] = useState<number | null>(null);
  const [claudeResult, setClaudeResult] = useState<ClaudeResult | null>(null);
  const [claudeMs, setClaudeMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<string>("");

  // ツイートURL から画像を取得するモード
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetImages, setTweetImages] = useState<TweetImage[]>([]);
  const [tweetError, setTweetError] = useState<string | null>(null);
  const [tweetLoading, setTweetLoading] = useState(false);
  // 各画像ごとの gvision 結果
  const [tweetParseResults, setTweetParseResults] = useState<
    Record<number, { result?: unknown; error?: string; ms?: number }>
  >({});

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setGoogleRaw(null);
      setGoogleParsed(null);
      setClaudeResult(null);
    };
    reader.readAsDataURL(file);
  };

  const getBase64 = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mediaType: match[1], base64: match[2] };
  };

  const runGoogleRaw = async () => {
    if (!imageDataUrl) return;
    const img = getBase64(imageDataUrl);
    if (!img) return;
    const start = performance.now();
    try {
      const res = await fetch("/api/analyze-team-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: img.base64, imageMediaType: img.mediaType }),
      });
      setGoogleRaw(await res.json());
      setGoogleRawMs(Math.round(performance.now() - start));
    } catch (err) {
      setGoogleRaw({ error: String(err) });
    }
  };

  const runGoogleParsed = async () => {
    if (!imageDataUrl) return;
    const img = getBase64(imageDataUrl);
    if (!img) return;
    const start = performance.now();
    try {
      const res = await fetch("/api/analyze-team-gvision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: img.base64, imageMediaType: img.mediaType }),
      });
      setGoogleParsed(await res.json());
      setGoogleParsedMs(Math.round(performance.now() - start));
    } catch (err) {
      setGoogleParsed({ error: String(err) });
    }
  };

  const runClaude = async () => {
    if (!imageDataUrl) return;
    const img = getBase64(imageDataUrl);
    if (!img) return;
    const start = performance.now();
    try {
      const res = await fetch("/api/analyze-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: img.base64, imageMediaType: img.mediaType }),
      });
      setClaudeResult(await res.json());
      setClaudeMs(Math.round(performance.now() - start));
    } catch (err) {
      setClaudeResult({ error: String(err) });
    }
  };

  // ツイートURL から画像一覧を取得
  const fetchTweet = async () => {
    if (!tweetUrl.trim() || tweetLoading) return;
    setTweetLoading(true);
    setTweetError(null);
    setTweetImages([]);
    setTweetParseResults({});
    try {
      const res = await fetch("/api/tweet-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tweetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTweetError(data.error ?? "取得に失敗しました");
      } else {
        setTweetImages(data.images ?? []);
      }
    } catch (err) {
      setTweetError(String(err));
    } finally {
      setTweetLoading(false);
    }
  };

  // 取得した画像の1枚を gvision に流す
  const parseTweetImage = async (idx: number) => {
    const img = tweetImages[idx];
    if (!img) return;
    const match = img.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return;
    const start = performance.now();
    setTweetParseResults((prev) => ({ ...prev, [idx]: { ms: undefined } }));
    try {
      const res = await fetch("/api/analyze-team-gvision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: match[2], imageMediaType: match[1] }),
      });
      const data = await res.json();
      setTweetParseResults((prev) => ({
        ...prev,
        [idx]: {
          result: data.result ?? data,
          error: data.error,
          ms: Math.round(performance.now() - start),
        },
      }));
    } catch (err) {
      setTweetParseResults((prev) => ({
        ...prev,
        [idx]: { error: String(err), ms: Math.round(performance.now() - start) },
      }));
    }
  };

  // 全画像をまとめて解析
  const parseAllTweetImages = async () => {
    await Promise.all(tweetImages.map((_, i) => parseTweetImage(i)));
  };

  const runAll = async () => {
    if (!imageDataUrl || isRunning) return;
    setIsRunning(true);
    setProgress("解析中...");
    await Promise.all([runGoogleRaw(), runGoogleParsed(), runClaude()]);
    setProgress("");
    setIsRunning(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <h1 className="text-xl font-bold">OCR 精度比較テスト</h1>
      <p className="text-sm text-slate-600">
        Google Cloud Vision（月1,000枚無料）vs Claude Vision（現行）の精度比較
      </p>

      {/* ツイートURL から一括取り込み */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">ツイートURL から読み込み</h2>
        <div className="flex gap-2">
          <input
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/..."
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={fetchTweet}
            disabled={tweetLoading || !tweetUrl.trim()}
            className="rounded bg-cyan-600 px-3 py-1 text-sm font-bold text-white disabled:opacity-50"
          >
            {tweetLoading ? "取得中..." : "取得"}
          </button>
          {tweetImages.length > 0 && (
            <button
              type="button"
              onClick={parseAllTweetImages}
              className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700"
            >
              全画像を解析
            </button>
          )}
        </div>
        {tweetError && <p className="text-xs text-red-600">{tweetError}</p>}
        {tweetImages.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {tweetImages.map((img, i) => {
              const r = tweetParseResults[i];
              return (
                <div key={i} className="rounded border border-slate-200 p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">画像 {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => parseTweetImage(i)}
                      className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700"
                    >
                      解析
                    </button>
                    {r?.ms !== undefined && (
                      <span className="text-[10px] text-slate-400">{r.ms}ms</span>
                    )}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={`tweet-${i}`} className="max-h-40 rounded border border-slate-200" />
                  {r?.error && <p className="text-xs text-red-600">{r.error}</p>}
                  {r?.result !== undefined && (
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[10px]">
                      {JSON.stringify(r.result, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-800">画像アップロード</h2>
        <input type="file" accept="image/*" onChange={onFileChange} className="block text-sm" />
        {imageDataUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="プレビュー" className="max-h-48 rounded border border-slate-200" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={runAll} disabled={isRunning}
                className="rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                全て実行
              </button>
              <button type="button" onClick={runGoogleParsed} disabled={isRunning}
                className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50">
                Google（構造化）のみ
              </button>
              <button type="button" onClick={runClaude} disabled={isRunning}
                className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50">
                Claude のみ
              </button>
            </div>
            {progress && <p className="text-xs text-slate-500">{progress}</p>}
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Google 生テキスト */}
        <div className="rounded-lg border border-blue-100 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            Google Vision 生テキスト
            {googleRawMs !== null && <span className="ml-2 text-xs font-normal text-slate-400">{googleRawMs}ms</span>}
          </h2>
          {googleRaw?.error && <p className="mb-1 text-xs text-red-600">{googleRaw.error}</p>}
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
            {googleRaw?.rawText ?? "(未実行)"}
          </pre>
        </div>

        {/* Google 構造化 */}
        <div className="rounded-lg border border-green-100 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            Google Vision 構造化（辞書マッチ）
            {googleParsedMs !== null && <span className="ml-2 text-xs font-normal text-slate-400">{googleParsedMs}ms</span>}
          </h2>
          {googleParsed?.error && <p className="mb-1 text-xs text-red-600">{googleParsed.error}</p>}
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
            {googleParsed
              ? JSON.stringify(googleParsed.result ?? googleParsed, null, 2)
              : "(未実行)"}
          </pre>
        </div>

        {/* Claude */}
        <div className="rounded-lg border border-violet-100 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-slate-800">
            Claude Vision（現行）
            {claudeMs !== null && <span className="ml-2 text-xs font-normal text-slate-400">{claudeMs}ms</span>}
          </h2>
          {claudeResult?.error && <p className="mb-1 text-xs text-red-600">{claudeResult.error}</p>}
          <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
            {claudeResult
              ? JSON.stringify(claudeResult.result ?? claudeResult, null, 2)
              : "(未実行)"}
          </pre>
        </div>
      </div>
    </div>
  );
}
