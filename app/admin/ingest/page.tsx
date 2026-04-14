// 構築取り込みツール (URL 貼付け + Claude Haiku Vision 版)
// X のツイートURL を貼る → fxtwitter で画像取得 → Claude Haiku Vision に投げて JSON 抽出
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cropTeamImage, dataUrlToBlob } from "@/lib/image-crop";
import { getHomeSpriteUrl } from "@/lib/pokemon-sprite";
import { getEnSlug, EN_TO_JA, resolvePokemonJaName } from "@/lib/pokemon-names";
import { MOVE_NAMES_JA } from "@/lib/move-names";
import { ABILITY_NAMES_JA } from "@/lib/ability-names";
import { ITEMS } from "@/lib/items";
import { NATURES } from "@/lib/natures";
import { parseRatingFromText } from "@/lib/rating-parse";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { NatureIndicatorLabel } from "@/components/admin/NatureIndicator";

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

// 信頼度レベル: exact=完全一致, fuzzy=ファジーマッチ, unmatched=辞書に該当なし
type Confidence = "exact" | "fuzzy" | "unmatched";

type FieldConfidence = {
  name: Confidence;
  ability: Confidence;
  item: Confidence;
  moves: Confidence[];
  teraType: Confidence;
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
  /** 各フィールドのマッチ信頼度 */
  confidence?: FieldConfidence;
};

type ParsedTeam = {
  teamTitle: string | null;
  trainerName: string | null;
  teamCode: string | null;
  pokemons: ParsedPokemon[];
};

type Stage = "idle" | "fetching" | "analyzing" | "saving";

// 検索ドロップダウン用のマスターデータリスト
const POKEMON_JA_OPTIONS = Array.from(new Set(Object.values(EN_TO_JA))).filter(Boolean).sort();
const MOVE_JA_OPTIONS = Array.from(new Set(Object.values(MOVE_NAMES_JA))).filter(Boolean).sort();
const ABILITY_JA_OPTIONS = Array.from(new Set(Object.values(ABILITY_NAMES_JA))).filter(Boolean).sort();
const ITEM_JA_OPTIONS = ITEMS.map((i) => i.ja).filter((n): n is string => Boolean(n) && !n.startsWith("もちものを選択")).sort();

const TERA_TYPES = [
  "ノーマル", "ほのお", "みず", "でんき", "くさ", "こおり",
  "かくとう", "どく", "じめん", "ひこう", "エスパー", "むし",
  "いわ", "ゴースト", "ドラゴン", "あく", "はがね", "フェアリー", "ステラ",
];

type NatureStatKey = "attack" | "defense" | "spAtk" | "spDef" | "speed";
const NATURE_STAT_KEYS: NatureStatKey[] = ["attack", "defense", "spAtk", "spDef", "speed"];
const NATURE_STAT_LABELS: Record<NatureStatKey, string> = {
  attack: "攻撃", defense: "防御", spAtk: "特攻", spDef: "特防", speed: "素早さ",
};
const NATURE_GRID: string[][] = [
  ["がんばりや", "さみしがり", "いじっぱり", "やんちゃ",   "ゆうかん"],
  ["ずぶとい",   "すなお",     "わんぱく",   "のうてんき", "のんき"],
  ["ひかえめ",   "おっとり",   "てれや",     "うっかりや", "れいせい"],
  ["おだやか",   "おとなしい", "しんちょう", "きまぐれ",   "なまいき"],
  ["おくびょう", "せっかち",   "ようき",     "むじゃき",   "まじめ"],
];

const STAT_KEYS: Array<keyof StatValues> = ["hp", "attack", "defense", "spAtk", "spDef", "speed"];
const MAX_SLOT_REANALYZE = 3;

function countFilledMoves(moves: string[]) {
  return moves.filter((move) => move && move.trim().length > 0).length;
}

function scorePokemonForRefine(pokemon: ParsedPokemon) {
  return (
    (pokemon.name ? 2 : 0) +
    (pokemon.ability ? 1 : 0) +
    (pokemon.item ? 2 : 0) +
    (pokemon.teraType ? 1 : 0) +
    countFilledMoves(pokemon.moves)
  );
}

function shouldRefinePokemon(pokemon: ParsedPokemon) {
  return !pokemon.name || !pokemon.ability || !pokemon.item || countFilledMoves(pokemon.moves) < 4;
}

function scoreStatBlock(values?: StatValues) {
  if (!values) return 0;
  return STAT_KEYS.reduce((score, key) => {
    return typeof values[key] === "number" && Number.isFinite(values[key]) ? score + 1 : score;
  }, 0);
}

function mergePokemon(base: ParsedPokemon, candidate: ParsedPokemon): ParsedPokemon {
  return {
    ...base,
    name: candidate.name?.trim() ? candidate.name : base.name,
    slug: candidate.slug ?? base.slug,
    ability: candidate.ability?.trim() ? candidate.ability : base.ability,
    item: candidate.item?.trim() ? candidate.item : base.item,
    teraType: candidate.teraType?.trim() ? candidate.teraType : base.teraType,
    gender:
      candidate.gender && candidate.gender !== "unknown" ? candidate.gender : base.gender,
    moves:
      countFilledMoves(candidate.moves) >= countFilledMoves(base.moves)
        ? candidate.moves
        : base.moves,
    nature: candidate.nature?.trim() ? candidate.nature : base.nature,
    stats:
      scoreStatBlock(candidate.stats) >= scoreStatBlock(base.stats)
        ? candidate.stats ?? base.stats
        : base.stats,
    evs:
      scoreStatBlock(candidate.evs) >= scoreStatBlock(base.evs)
        ? candidate.evs ?? base.evs
        : base.evs,
  };
}

function scoreStatsCandidate(pokemon: {
  name?: string | null;
  nature?: string | null;
  stats?: StatValues;
  evs?: StatValues;
}) {
  return (
    (pokemon.name ? 1 : 0) +
    (pokemon.nature ? 2 : 0) +
    scoreStatBlock(pokemon.stats) +
    scoreStatBlock(pokemon.evs)
  );
}

export default function IngestPage() {
  const [url, setUrl] = useState("");
  const [tweetData, setTweetData] = useState<TweetData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saveFormat, setSaveFormat] = useState<"single" | "double">("single");
  const [savedTeamId, setSavedTeamId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState<string>("");

  const updatePokemon = useCallback(
    (slot: number, updater: (pokemon: ParsedPokemon) => ParsedPokemon) => {
      setParsed((current) => {
        if (!current) return current;
        return {
          ...current,
          pokemons: current.pokemons.map((pokemon) =>
            pokemon.slot === slot ? updater(pokemon) : pokemon,
          ),
        };
      });
    },
    [],
  );

  const updatePokemonField = useCallback(
    (
      slot: number,
      field: "name" | "ability" | "item" | "teraType" | "nature",
      value: string,
    ) => {
      updatePokemon(slot, (pokemon) => {
        let nextValue: string | null = value.trim() ? value : null;
        // 名前の場合はエイリアスを適用（例: フラエッテ → フラエッテ(えいえん)）
        if (field === "name" && nextValue) {
          nextValue = resolvePokemonJaName(nextValue) ?? nextValue;
        }
        const updated = { ...pokemon, [field]: nextValue };
        if (field === "name") {
          updated.slug = nextValue ? getEnSlug(nextValue) ?? null : null;
        }
        return updated;
      });
    },
    [updatePokemon],
  );

  const updatePokemonMove = useCallback(
    (slot: number, moveIndex: number, value: string) => {
      updatePokemon(slot, (pokemon) => {
        const moves = [...pokemon.moves];
        while (moves.length < 4) moves.push("");
        moves[moveIndex] = value;
        return { ...pokemon, moves };
      });
    },
    [updatePokemon],
  );

  const updatePokemonStat = useCallback(
    (slot: number, group: "stats" | "evs", key: keyof StatValues, value: string) => {
      updatePokemon(slot, (pokemon) => {
        const current = pokemon[group] ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
        return { ...pokemon, [group]: { ...current, [key]: Number(value) || 0 } };
      });
    },
    [updatePokemon],
  );

  /** 1 枚の画像を Claude Haiku に投げて結果を返す。失敗時は null */
  const callAnalyzeApi = useCallback(
    async (
      dataUrl: string,
      slot?: number,
    ): Promise<{ parsed: ParsedTeam | ParsedPokemon | null; rawText: string | null; error?: string }> => {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return { parsed: null, rawText: null, error: "画像データ形式が不正" };
      }
      const [, mediaType, base64] = match;

      try {
        const res = await fetch("/api/analyze-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType, slot }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            parsed: null,
            rawText: data?.rawText ?? null,
            error: data?.error ?? "解析失敗",
          };
        }
        return { parsed: data.result as ParsedTeam | ParsedPokemon, rawText: data.rawText ?? null };
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

  /** 解析結果のスコア: 特性・持ち物・技が読めているほど高スコア（能力画面を優先） */
  const scoreResult = (result: ParsedTeam | null): number => {
    if (!result) return -1;
    return result.pokemons.reduce((score, p) => {
      return score +
        (p.name ? 1 : 0) +
        (p.ability ? 2 : 0) +
        (p.item ? 2 : 0) +
        Math.min(p.moves.filter((m) => m && m.trim()).length, 4) * 2;
    }, 0);
  };

  const refineIncompleteSlots = useCallback(
    async (imageDataUrl: string, team: ParsedTeam) => {
      const targets = [...team.pokemons]
        .filter(shouldRefinePokemon)
        .sort((a, b) => scorePokemonForRefine(a) - scorePokemonForRefine(b))
        .slice(0, MAX_SLOT_REANALYZE);

      if (targets.length === 0) {
        return team;
      }

      try {
        const cropped = await cropTeamImage(await dataUrlToBlob(imageDataUrl));
        let nextTeam = team;

        for (const pokemon of targets) {
          const crop = cropped[pokemon.slot - 1];
          if (!crop) continue;

          const result = await callAnalyzeApi(crop.dataUrl, pokemon.slot);
          const candidate = result.parsed as ParsedPokemon | null;
          if (!candidate || typeof candidate !== "object") continue;

          nextTeam = {
            ...nextTeam,
            pokemons: nextTeam.pokemons.map((current) =>
              current.slot === pokemon.slot ? mergePokemon(current, candidate) : current,
            ),
          };
        }

        return nextTeam;
      } catch {
        return team;
      }
    },
    [callAnalyzeApi],
  );

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
      let detectedRatingFromImage: number | null = null;
      const limit = Math.min(images.length, 4);

      for (let i = 0; i < limit; i++) {
        const result = await callAnalyzeApi(images[i].dataUrl);
        if (result.error) lastError = result.error;
        const parsedTeam = result.parsed as ParsedTeam | null;
        // 各解析結果からレートを収集 (バトル画面に写ってることが多い)
        const maybeRating = (result.parsed as { rating?: unknown })?.rating;
        if (typeof maybeRating === "number" && Number.isFinite(maybeRating) && maybeRating >= 1000 && maybeRating <= 3000) {
          if (detectedRatingFromImage == null || maybeRating > detectedRatingFromImage) {
            detectedRatingFromImage = maybeRating;
          }
        }
        const score = scoreResult(parsedTeam);
        if (score > best.score) {
          best = { index: i, parsed: parsedTeam, rawText: result.rawText, score };
        }
        // 6匹×(名前1+特性2+持ち物2+技4×2)=66が満点。30以上なら十分
        if (score >= 30) break;
      }

      // 画像から検出したレートがあれば入力欄を更新 (ツイート本文抽出より優先)
      if (detectedRatingFromImage != null) {
        setRatingInput(String(detectedRatingFromImage));
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

      if (best.parsed) {
        best.parsed = await refineIncompleteSlots(images[best.index].dataUrl, best.parsed);
      }

      // Phase 2: 他の画像をステータス画面として解析し、努力値をマージ
      if (best.parsed && images.length > 1) {
        let mergedTeam = best.parsed;
        for (let i = 0; i < limit; i++) {
          if (i === best.index) continue; // 能力画面はスキップ
          const statsResult = await callStatsApi(images[i].dataUrl);
          if (statsResult.stats.length > 0) {
            mergedTeam = {
              ...mergedTeam,
              pokemons: mergedTeam.pokemons.map((p) => {
                const matching = statsResult.stats.find((s) => s.slot === p.slot);
                if (!matching) return p;
                const candidateScore = scoreStatsCandidate(matching);
                const currentScore = scoreStatsCandidate(p);
                if (candidateScore < currentScore) return p;
                return {
                  ...p,
                  nature: matching.nature ?? p.nature,
                  stats:
                    scoreStatBlock(matching.stats) >= scoreStatBlock(p.stats)
                      ? matching.stats ?? p.stats
                      : p.stats,
                  evs:
                    scoreStatBlock(matching.evs) >= scoreStatBlock(p.evs)
                      ? matching.evs ?? p.evs
                      : p.evs,
                };
              }),
            };
          }
        }
        best.parsed = mergedTeam;
      }

      setActiveImageIndex(best.index);
      setParsed(best.parsed);
      setRawText(best.rawText);
      setStage("idle");
    },
    [callAnalyzeApi, callStatsApi, refineIncompleteSlots],
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
      // ツイート本文からレートを自動抽出 (あれば)
      const detectedRating = parseRatingFromText((data as TweetData).text);
      setRatingInput(detectedRating != null ? String(detectedRating) : "");

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
      if (result.parsed) setParsed(result.parsed as ParsedTeam);
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
              onFocus={(e) => e.currentTarget.select()}
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
                  ({filledCount}/6 体)
                </span>
              </h2>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />完全一致</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />ファジーマッチ(要確認)</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-400" />該当なし(要修正)</span>
              </div>
              {(parsed.trainerName || parsed.teamCode) && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {parsed.trainerName && `プレイヤー: ${parsed.trainerName}`}
                  {parsed.trainerName && parsed.teamCode && "  ·  "}
                  {parsed.teamCode && `チームID: ${parsed.teamCode}`}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {parsed.pokemons.map((p) => (
              <PokemonResultCard
                key={p.slot}
                pokemon={p}
                onFieldChange={updatePokemonField}
                onMoveChange={updatePokemonMove}
                onStatChange={updatePokemonStat}
              />
            ))}
          </div>

          {/* 形式選択 + レート + 登録ボタン（一番下） */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* シングル/ダブル トグル */}
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {(["single", "double"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSaveFormat(f)}
                  className={
                    saveFormat === f
                      ? "rounded-full bg-cyan-500 px-5 py-1.5 text-xs font-bold text-white shadow"
                      : "rounded-full px-5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                  }
                >
                  {f === "single" ? "シングル" : "ダブル"}
                </button>
              ))}
            </div>

            {/* レート入力 (任意) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">
                レート (任意)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={ratingInput}
                onChange={(e) => setRatingInput(e.target.value)}
                placeholder="例: 2048.5"
                className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
              />
              {ratingInput && (
                <button
                  type="button"
                  onClick={() => setRatingInput("")}
                  className="text-[11px] text-slate-400 hover:text-slate-700"
                >
                  クリア
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={stage === "saving" || !!savedTeamId}
              onClick={async () => {
                if (!parsed || !tweetData) return;
                setStage("saving");
                setSavedTeamId(null);
                setCopyFeedback(null);
                try {
                  const ratingNum = Number.parseFloat(ratingInput);
                  const ratingPayload =
                    Number.isFinite(ratingNum) && ratingNum > 0 ? ratingNum : null;
                  const res = await fetch("/api/teams/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      trainerName: parsed.trainerName,
                      teamCode: parsed.teamCode,
                      tweetUrl: tweetData.tweetUrl,
                      format: saveFormat,
                      rating: ratingPayload,
                      pokemons: parsed.pokemons,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error ?? "保存失敗");
                  setSavedTeamId(data.id as string);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "保存に失敗しました");
                } finally {
                  setStage("idle");
                }
              }}
              className={
                savedTeamId
                  ? "rounded-full bg-emerald-100 px-8 py-3 text-sm font-bold text-emerald-700"
                  : "btn-neon rounded-full px-8 py-3 text-sm disabled:opacity-60"
              }
            >
              {stage === "saving" ? "保存中…" : savedTeamId ? "✅ 登録完了" : "🚀 登録して公開"}
            </button>
          </div>

          {/* 登録完了後: 構築ページの URL を表示してコピー & プレビュー */}
          {savedTeamId && (
            <SavedTeamLink
              teamId={savedTeamId}
              copyFeedback={copyFeedback}
              onCopyFeedback={setCopyFeedback}
            />
          )}
        </section>
      )}

      {/* 生レスポンス (デバッグ): エラー時のみ表示 */}
      {error && rawText && (
        <details
          className="rounded-xl border border-slate-200 bg-white p-3 text-[11px]"
          open
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

// 信頼度に応じたボーダー色クラスを返す
function confidenceBorderClass(level?: Confidence): string {
  if (!level) return "border-slate-200";
  switch (level) {
    case "exact": return "border-emerald-400";
    case "fuzzy": return "border-amber-400";
    case "unmatched": return "border-rose-400";
  }
}

// 信頼度ドットインジケータ
function ConfidenceDot({ level }: { level?: Confidence }) {
  if (!level || level === "exact") return null;
  const color = level === "fuzzy" ? "bg-amber-400" : "bg-rose-400";
  const title = level === "fuzzy" ? "ファジーマッチ（要確認）" : "辞書に該当なし（要修正）";
  return <span className={`inline-block ml-1 h-1.5 w-1.5 rounded-full ${color}`} title={title} />;
}

function PokemonResultCard({
  pokemon,
  onFieldChange,
  onMoveChange,
  onStatChange,
}: {
  pokemon: ParsedPokemon;
  onFieldChange: (
    slot: number,
    field: "name" | "ability" | "item" | "teraType" | "nature",
    value: string,
  ) => void;
  onMoveChange: (slot: number, moveIndex: number, value: string) => void;
  onStatChange: (slot: number, group: "stats" | "evs", key: keyof StatValues, value: string) => void;
}) {
  // サーバー側で名寄せ済みの slug を優先、なければクライアント側で試行
  const slug = pokemon.slug ?? (pokemon.name ? getEnSlug(pokemon.name) : null);
  const conf = pokemon.confidence;
  const fieldsFilled =
    (pokemon.name ? 1 : 0) +
    (pokemon.ability ? 1 : 0) +
    (pokemon.item ? 1 : 0) +
    Math.min(pokemon.moves.length, 4);
  const isComplete = fieldsFilled >= 7;

  // 信頼度サマリー: 要確認フィールド数を計算
  const needsReviewCount = conf ? (
    [conf.name, conf.ability, conf.item, conf.teraType, ...conf.moves]
      .filter((c) => c === "fuzzy" || c === "unmatched").length
  ) : 0;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${needsReviewCount > 0 ? "border-amber-300" : "border-slate-200"}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400">
            SLOT {pokemon.slot}
          </span>
          <div className="flex items-center gap-1.5">
            {needsReviewCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {needsReviewCount}件要確認
              </span>
            )}
            <span
              className={
                isComplete && needsReviewCount === 0
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                  : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500"
              }
            >
              {fieldsFilled}/7 項目
            </span>
          </div>
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
          <div className="grid min-w-0 flex-1 gap-2">
            <div className="grid gap-2 md:grid-cols-[1.2fr,0.8fr]">
              <div className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">ポケモン名<ConfidenceDot level={conf?.name} /></span>
                <SearchableSelect
                  value={pokemon.name ?? ""}
                  onChange={(v) => onFieldChange(pokemon.slot, "name", v)}
                  options={POKEMON_JA_OPTIONS}
                  placeholder="ポケモン名"
                  className={`rounded-lg border bg-white px-2.5 py-2 text-sm font-black text-slate-900 outline-none focus:border-cyan-400 ${confidenceBorderClass(conf?.name)}`}
                />
              </div>
              <div className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">テラスタイプ</span>
                <TeraTypeGrid
                  value={pokemon.teraType ?? null}
                  onChange={(v) => onFieldChange(pokemon.slot, "teraType", v ?? "")}
                />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">特性<ConfidenceDot level={conf?.ability} /></span>
                <SearchableSelect
                  value={pokemon.ability ?? ""}
                  onChange={(v) => onFieldChange(pokemon.slot, "ability", v)}
                  options={ABILITY_JA_OPTIONS}
                  placeholder="特性"
                  className={`rounded-lg border bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 ${confidenceBorderClass(conf?.ability)}`}
                />
              </div>
              <div className="grid gap-1">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">持ち物<ConfidenceDot level={conf?.item} /></span>
                <SearchableSelect
                  value={pokemon.item ?? ""}
                  onChange={(v) => onFieldChange(pokemon.slot, "item", v)}
                  options={ITEM_JA_OPTIONS}
                  placeholder="持ち物"
                  className={`rounded-lg border bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 ${confidenceBorderClass(conf?.item)}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
          {[0, 1, 2, 3].map((i) => (
            <SearchableSelect
              key={i}
              value={pokemon.moves[i] ?? ""}
              onChange={(v) => onMoveChange(pokemon.slot, i, v)}
              options={MOVE_JA_OPTIONS}
              placeholder={`技${i + 1}`}
              className={`rounded-lg border bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-cyan-400 ${confidenceBorderClass(conf?.moves?.[i])}`}
            />
          ))}
        </div>

        {/* 性格パレット */}
        <NaturePalette
          value={pokemon.nature ?? null}
          onChange={(v) => onFieldChange(pokemon.slot, "nature", v ?? "")}
        />

        {/* ステータス & 努力値 */}
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500">
            実数値 / 努力値
          </p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px]">
            {([
              ["HP", "hp"],
              ["こうげき", "attack"],
              ["ぼうぎょ", "defense"],
              ["とくこう", "spAtk"],
              ["とくぼう", "spDef"],
              ["すばやさ", "speed"],
            ] as const).map(([label, key]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="w-14 shrink-0 text-slate-500">{label}{key !== "hp" && <NatureIndicatorLabel nature={pokemon.nature} stat={key} />}</span>
                <input
                  type="number"
                  value={pokemon.stats?.[key] ?? ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onStatChange(pokemon.slot, "stats", key, e.target.value)}
                  placeholder="実数値"
                  className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-slate-900 outline-none focus:border-cyan-400"
                />
                <input
                  type="number"
                  value={pokemon.evs?.[key] ?? ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onStatChange(pokemon.slot, "evs", key, e.target.value)}
                  placeholder="努力値"
                  className={`w-12 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center font-mono text-[10px] outline-none focus:border-amber-400 ${(pokemon.evs?.[key] ?? 0) > 0 ? "font-bold text-amber-600" : "text-slate-400"}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeraTypeGrid({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="grid grid-cols-5 gap-0.5">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(null)}
        className={`py-1 text-[9px] rounded border font-bold transition-colors ${
          !value ? "bg-slate-500 text-white border-slate-500" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
        }`}
      >
        なし
      </button>
      {TERA_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(t)}
          className={`py-1 text-[9px] rounded border font-bold transition-colors ${
            value === t
              ? "bg-violet-500 text-white border-violet-500"
              : "bg-white text-slate-600 border-slate-200 hover:bg-violet-50 hover:border-violet-300"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function NaturePalette({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
      <p className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
        性格補正
      </p>
      <div className="grid grid-cols-6 border-b border-slate-100">
        <div className="bg-slate-50" />
        {NATURE_STAT_KEYS.map((key) => (
          <div key={key} className="bg-indigo-50 px-0.5 py-1 text-center text-[9px] font-bold text-indigo-600 border-l border-slate-100">
            {NATURE_STAT_LABELS[key]}<span className="text-sky-500">↓</span>
          </div>
        ))}
      </div>
      {NATURE_GRID.map((row, ri) => (
        <div key={ri} className="grid grid-cols-6">
          <div className="bg-indigo-50 flex items-center justify-center px-0.5 py-1 border-t border-slate-100">
            <span className="text-[9px] font-bold text-indigo-600">
              {NATURE_STAT_LABELS[NATURE_STAT_KEYS[ri]]}<span className="text-rose-500">↑</span>
            </span>
          </div>
          {row.map((nature, ci) => {
            const isNeutral = ri === ci;
            const isSelected = value === nature;
            return (
              <button
                key={nature}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(nature)}
                className={`py-1 text-[10px] font-medium border-t border-l border-slate-100 transition-colors ${
                  isSelected
                    ? "bg-green-500 text-white font-bold"
                    : isNeutral
                      ? "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      : "hover:bg-indigo-50 text-slate-700"
                }`}
              >
                {nature}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// 登録完了後に構築ページ URL を表示し、コピー/プレビューできるようにする
function SavedTeamLink({
  teamId,
  copyFeedback,
  onCopyFeedback,
}: {
  teamId: string;
  copyFeedback: string | null;
  onCopyFeedback: (msg: string | null) => void;
}) {
  // ブラウザ側で絶対URLを組み立て (SSR 時は window が無いので空文字)
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const teamUrl = `${origin}/teams/${encodeURIComponent(teamId)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(teamUrl);
      onCopyFeedback("✅ コピーしました");
      setTimeout(() => onCopyFeedback(null), 2000);
    } catch {
      onCopyFeedback("❌ コピーに失敗しました");
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="text-[11px] font-bold tracking-wider text-emerald-700">
        🎉 構築ページが公開されました
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={teamUrl}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-[240px] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-600"
        >
          📋 URLをコピー
        </button>
        <a
          href={teamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
        >
          👀 ページを開く
        </a>
      </div>
      {copyFeedback && (
        <p className="mt-2 text-[11px] font-bold text-emerald-700">{copyFeedback}</p>
      )}
    </div>
  );
}
