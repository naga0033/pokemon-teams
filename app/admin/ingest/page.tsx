// 構築取り込みツール (URL 貼付け + Claude Haiku Vision 版)
// X のツイートURL を貼る → fxtwitter で画像取得 → Claude Haiku Vision に投げて JSON 抽出
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getHomeSpriteUrl } from "@/lib/pokemon-sprite";
import { getEnSlug } from "@/lib/pokemon-names";

type TweetData = {
  tweetId: string;
  tweetUrl: string;
  text: string;
  author: { name: string; screenName: string };
  images: Array<{ sourceUrl: string; dataUrl: string }>;
};

type StatValues = {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
};

type ParsedPokemon = {
  slot: number;
  name: string | null;
  slug: string | null;
  ability: string | null;
  item: string | null;
  teraType: string | null;
  gender: "male" | "female" | "unknown" | null;
  moves: string[];
  /** 性格 (ステータス画面から判定) */
  nature?: string;
  /** 実数値 (ステータス画面から取得した場合) */
  stats?: StatValues;
  /** 努力値 (ステータス画面から取得した場合) */
  evs?: StatValues;
};

type ParsedTeam = {
  teamTitle: string | null;
  trainerName: string | null;
  teamCode: string | null;
  pokemons: ParsedPokemon[];
};

type Stage = "idle" | "fetching" | "analyzing" | "saving";

export default function IngestPage() {
  const [url, setUrl] = useState("");
  const [tweetData, setTweetData] = useState<TweetData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saveFormat, setSaveFormat] = useState<"single" | "double">("single");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  /** 1 枚の画像を Claude Haiku に投げて結果を返す。失敗時は null */
  const callAnalyzeApi = useCallback(
    async (
      dataUrl: string,
    ): Promise<{ parsed: ParsedTeam | null; rawText: string | null; error?: string }> => {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return { parsed: null, rawText: null, error: "画像データ形式が不正" };
      }
      const [, mediaType, base64] = match;

      try {
        const res = await fetch("/api/analyze-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            parsed: null,
            rawText: data?.rawText ?? null,
            error: data?.error ?? "解析失敗",
          };
        }
        return { parsed: data.result as ParsedTeam, rawText: data.rawText ?? null };
      } catch (err) {
        return {
          parsed: null,
          rawText: null,
          error: err instanceof Error ? err.message : "ネットワークエラー",
        };
      }
    },
    [],
  );

  /** 解析結果のスコア: 名前が読めてるポケモンの数 */
  const scoreResult = (result: ParsedTeam | null): number => {
    if (!result) return -1;
    return result.pokemons.filter((p) => p.name && p.name.trim().length > 0).length;
  };

  /** ステータス画面 (実数値/努力値) を解析する */
  const callStatsApi = useCallback(
    async (dataUrl: string): Promise<{
      stats: Array<{ slot: number; name?: string; nature?: string; stats?: StatValues; evs?: StatValues }>;
      error?: string;
    }> => {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return { stats: [], error: "画像データ形式が不正" };
      const [, mediaType, base64] = match;
      try {
        const res = await fetch("/api/analyze-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType }),
        });
        const data = await res.json();
        if (!res.ok) return { stats: [], error: data?.error ?? "解析失敗" };
        const pokemons = (data.result as { pokemons?: unknown[] })?.pokemons;
        if (!Array.isArray(pokemons)) return { stats: [], error: "ステータスデータなし" };
        return {
          stats: pokemons as Array<{ slot: number; name?: string; nature?: string; stats?: StatValues; evs?: StatValues }>,
        };
      } catch (err) {
        return { stats: [], error: err instanceof Error ? err.message : "エラー" };
      }
    },
    [],
  );

  /** 複数画像を全て解析: 能力画面 → ベスト選択、ステータス画面 → 努力値マージ */
  const analyzeAllImages = useCallback(
    async (images: TweetData["images"]) => {
      setStage("analyzing");
      setError(null);
      setParsed(null);
      setRawText(null);

      // Phase 1: 全画像を能力画面として解析、ベストを選ぶ
      let best: {
        index: number;
        parsed: ParsedTeam | null;
        rawText: string | null;
        score: number;
      } = { index: 0, parsed: null, rawText: null, score: -1 };
      let lastError: string | null = null;
      const limit = Math.min(images.length, 4);

      for (let i = 0; i < limit; i++) {
        const result = await callAnalyzeApi(images[i].dataUrl);
        if (result.error) lastError = result.error;
        const score = scoreResult(result.parsed);
        if (score > best.score) {
          best = { index: i, parsed: result.parsed, rawText: result.rawText, score };
        }
        if (score >= 6) break;
      }

      if (best.score <= 0) {
        setActiveImageIndex(best.index);
        setParsed(best.parsed);
        setRawText(best.rawText);
        setError(
          lastError ??
            "どの画像からもポケモン情報を読み取れませんでした。能力画面のスクショ付きツイートで試してください。",
        );
        setStage("idle");
        return;
      }

      // Phase 2: 他の画像をステータス画面として解析し、努力値をマージ
      if (best.parsed && images.length > 1) {
        for (let i = 0; i < limit; i++) {
          if (i === best.index) continue; // 能力画面はスキップ
          const statsResult = await callStatsApi(images[i].dataUrl);
          if (statsResult.stats.length > 0) {
            // スロット番号でマージ
            const merged = best.parsed.pokemons.map((p) => {
              const matching = statsResult.stats.find((s) => s.slot === p.slot);
              if (!matching) return p;
              return {
                ...p,
                nature: matching.nature ?? undefined,
                stats: matching.stats ?? undefined,
                evs: matching.evs ?? undefined,
              };
            });
            best.parsed = { ...best.parsed, pokemons: merged };
            break; // 最初にヒットしたステータス画面だけ使う
          }
        }
      }

      setActiveImageIndex(best.index);
      setParsed(best.parsed);
      setRawText(best.rawText);
      setStage("idle");
    },
    [callAnalyzeApi, callStatsApi],
  );

  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;
    setError(null);
    setTweetData(null);
    setParsed(null);
    setRawText(null);
    setStage("fetching");

    try {
      const res = await fetch("/api/tweet-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "取得失敗");
      }

      setTweetData(data as TweetData);

      if (data.images?.length > 0) {
        await analyzeAllImages(data.images);
      } else {
        setStage("idle");
        setError("画像が見つかりませんでした");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "取り込みに失敗しました");
      setStage("idle");
    }
  }, [url, analyzeAllImages]);

  /** 画像サムネイルクリックで特定の画像だけ再解析 */
  const switchImage = useCallback(
    async (index: number) => {
      if (!tweetData || index === activeImageIndex) return;
      setActiveImageIndex(index);
      setStage("analyzing");
      setError(null);
      setParsed(null);
      setRawText(null);
      const result = await callAnalyzeApi(tweetData.images[index].dataUrl);
      if (result.rawText) setRawText(result.rawText);
      if (result.parsed) setParsed(result.parsed);
      if (result.error) setError(result.error);
      setStage("idle");
    },
    [tweetData, activeImageIndex, callAnalyzeApi],
  );

  const loading = stage !== "idle";
  const filledCount = parsed?.pokemons.filter(
    (p) => p.name && p.ability && p.item && p.moves.length >= 4,
  ).length ?? 0;

  return (
    <div className="space-y-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-[11px] tracking-wider text-slate-400">
        <Link href="/" className="hover:text-cyan-600">
          ホーム
        </Link>
        <span>›</span>
        <span className="text-slate-700">取り込みツール</span>
      </div>

      {/* 見出し */}
      <header>
        <p className="font-display text-[11px] font-bold tracking-[0.3em] text-cyan-600">
          INGEST TOOL
        </p>
        <h1 className="mt-1 font-display text-2xl font-black text-slate-900 md:text-3xl">
          ツイートから構築を取り込む
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          X のツイートURL を貼ると、画像を自動で読み取り構築データに変換します。
        </p>
      </header>

      {/* URL 入力カード */}
      <div className="card-frame">
        <div className="card-body p-5 md:p-6">
          <label className="block text-xs font-bold tracking-wider text-slate-500">
            ツイートURL
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && url.trim()) handleFetch();
              }}
              placeholder="https://x.com/ユーザー名/status/..."
              className="neon-input flex-1 min-w-[240px] rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="btn-neon rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {loading ? "処理中…" : "取り込む"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            x.com / twitter.com どちらの URL でも OK
          </p>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ⚠ {error}
        </div>
      )}

      {/* 進捗 */}
      {loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              {stage === "fetching" && "ツイート取得中…"}
              {stage === "analyzing" && "Claude Haiku で解析中…"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-cyan-400 to-violet-500" />
          </div>
        </div>
      )}

      {/* ツイート情報 */}
      {tweetData && (
        <div className="card-frame">
          <div className="card-body p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-slate-500">
                  投稿者
                </p>
                <p className="mt-0.5 text-sm font-black text-slate-900">
                  {tweetData.author.name || "(unknown)"}
                  {tweetData.author.screenName && (
                    <span className="ml-2 font-normal text-slate-400">
                      @{tweetData.author.screenName}
                    </span>
                  )}
                </p>
                {tweetData.text && (
                  <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                    {tweetData.text.length > 280
                      ? `${tweetData.text.slice(0, 280)}…`
                      : tweetData.text}
                  </p>
                )}
                <a
                  href={tweetData.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[11px] font-bold text-cyan-600 hover:underline"
                >
                  元ツイートを開く →
                </a>
              </div>
              {tweetData.images.length > 1 && (
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[10px] font-bold text-slate-500">
                    画像 ({tweetData.images.length}枚)
                  </p>
                  <div className="flex gap-1.5">
                    {tweetData.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => switchImage(i)}
                        disabled={loading}
                        className={
                          activeImageIndex === i
                            ? "h-12 w-12 overflow-hidden rounded-lg ring-2 ring-cyan-400"
                            : "h-12 w-12 overflow-hidden rounded-lg opacity-60 ring-1 ring-slate-200 hover:opacity-100"
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.dataUrl}
                          alt={`画像${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 解析結果 */}
      {parsed && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-black text-slate-900">
                解析結果
                <span className="ml-2 text-sm font-normal text-slate-400">
                  (完全一致 {filledCount}/6 体)
                </span>
              </h2>
              {(parsed.trainerName || parsed.teamCode) && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {parsed.trainerName && `プレイヤー: ${parsed.trainerName}`}
                  {parsed.trainerName && parsed.teamCode && "  ·  "}
                  {parsed.teamCode && `チームID: ${parsed.teamCode}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 形式選択 */}
              <select
                value={saveFormat}
                onChange={(e) => setSaveFormat(e.target.value as "single" | "double")}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
              >
                <option value="single">シングル</option>
                <option value="double">ダブル</option>
              </select>
              {/* 登録ボタン */}
              <button
                type="button"
                disabled={stage === "saving" || !!saveSuccess}
                onClick={async () => {
                  if (!parsed || !tweetData) return;
                  setStage("saving");
                  setSaveSuccess(null);
                  try {
                    const res = await fetch("/api/teams/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        trainerName: parsed.trainerName,
                        teamCode: parsed.teamCode,
                        tweetUrl: tweetData.tweetUrl,
                        format: saveFormat,
                        pokemons: parsed.pokemons,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error ?? "保存失敗");
                    setSaveSuccess(`✅ 登録しました！ (ID: ${data.id})`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "保存に失敗しました");
                  } finally {
                    setStage("idle");
                  }
                }}
                className={
                  saveSuccess
                    ? "rounded-full bg-emerald-100 px-5 py-2 text-xs font-bold text-emerald-700"
                    : "btn-neon rounded-full px-5 py-2 text-xs disabled:opacity-60"
                }
              >
                {stage === "saving" ? "保存中…" : saveSuccess ? saveSuccess : "🚀 登録して公開"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {parsed.pokemons.map((p) => (
              <PokemonResultCard key={p.slot} pokemon={p} />
            ))}
          </div>
        </section>
      )}

      {/* 生レスポンス (デバッグ): parsed の有無に関わらず rawText があれば表示 */}
      {rawText && (
        <details
          className="rounded-xl border border-slate-200 bg-white p-3 text-[11px]"
          open={!parsed}
        >
          <summary className="cursor-pointer font-bold text-slate-500">
            Claude からの生レスポンス (デバッグ用)
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-slate-600">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  );
}

function PokemonResultCard({ pokemon }: { pokemon: ParsedPokemon }) {
  // サーバー側で名寄せ済みの slug を優先、なければクライアント側で試行
  const slug = pokemon.slug ?? (pokemon.name ? getEnSlug(pokemon.name) : null);
  const fieldsFilled =
    (pokemon.name ? 1 : 0) +
    (pokemon.ability ? 1 : 0) +
    (pokemon.item ? 1 : 0) +
    Math.min(pokemon.moves.length, 4);
  const isComplete = fieldsFilled >= 7;

  return (
    <div className="card-frame">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400">
            SLOT {pokemon.slot}
          </span>
          <span
            className={
              isComplete
                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"
            }
          >
            {fieldsFilled}/7 項目
          </span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          {slug ? (
            <div className="relative h-16 w-16 shrink-0 rounded-xl bg-slate-50 ring-1 ring-slate-200">
              <Image
                src={getHomeSpriteUrl(slug)}
                alt={pokemon.name ?? ""}
                fill
                sizes="64px"
                className="object-contain p-1"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-slate-900">
              {pokemon.name ?? "(名前未認識)"}
              {pokemon.teraType && (
                <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 ring-1 ring-violet-200">
                  テラス: {pokemon.teraType}
                </span>
              )}
            </p>
            {pokemon.ability && (
              <p className="text-xs text-slate-600">
                <span className="text-slate-400">特性:</span> {pokemon.ability}
              </p>
            )}
            {pokemon.item && (
              <p className="text-xs text-slate-600">
                <span className="text-slate-400">持ち物:</span> {pokemon.item}
              </p>
            )}
            {pokemon.nature && (
              <p className="text-xs text-slate-600">
                <span className="text-slate-400">性格:</span>{" "}
                <span className="font-bold text-violet-600">{pokemon.nature}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={
                pokemon.moves[i]
                  ? "truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
                  : "truncate rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-400"
              }
            >
              <span className="mr-1 text-cyan-500">›</span>
              {pokemon.moves[i] ?? "(未認識)"}
            </div>
          ))}
        </div>

        {/* ステータス & 努力値 (ステータス画面が読めた場合のみ表示) */}
        {pokemon.stats && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">
              ステータス / 努力値
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
              {([
                ["HP", "hp"],
                ["こうげき", "attack"],
                ["ぼうぎょ", "defense"],
                ["とくこう", "spAtk"],
                ["とくぼう", "spDef"],
                ["すばやさ", "speed"],
              ] as const).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {pokemon.stats?.[key] ?? "?"}
                    {pokemon.evs && (
                      <span className={`ml-1 text-[10px] ${(pokemon.evs[key] ?? 0) > 0 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                        ({pokemon.evs[key] ?? 0})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
