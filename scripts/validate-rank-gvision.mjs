// 順位/レート画面解析の検証スクリプト
// 構築コレクションから rank/rating が入っている構築をランダム抽出し、
// ツイート画像を gvision に投げて screenType=="rank" の結果を確認する
//
// 使い方:
//   cd /Users/nagatsuyuudai/Desktop/pokemon-teams
//   node scripts/validate-rank-gvision.mjs [件数(省略時10)]

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEV_BASE = process.env.DEV_BASE_URL ?? "http://localhost:3100";
const N = Number.parseInt(process.argv[2] ?? "10", 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase 環境変数が見つかりません");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchRandomTeams(limit) {
  // rank か rating のどちらかが入っている構築を対象にする
  const { data, error } = await supabase
    .from("teams")
    .select("id, title, author, source_url, rank, rating")
    .not("source_url", "is", null)
    .eq("is_public", true)
    .or("rank.not.is.null,rating.not.is.null");
  if (error) throw new Error(error.message);
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

async function tweetFetch(url) {
  const res = await fetch(`${DEV_BASE}/api/tweet-fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`tweet-fetch ${res.status}: ${await res.text()}`);
  return res.json();
}

async function analyzeImage(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const res = await fetch(`${DEV_BASE}/api/analyze-team-gvision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: m[2], imageMediaType: m[1] }),
  });
  if (!res.ok) return { error: `${res.status}: ${await res.text()}` };
  return res.json();
}

async function main() {
  console.log(`対象: ${N} 件をランダム抽出 (rank または rating が入っているもの)`);
  const teams = await fetchRandomTeams(N);
  console.log(`Supabase から ${teams.length} 件取得\n`);

  const report = { target: teams.length, teams: [] };

  for (const [i, team] of teams.entries()) {
    console.log(
      `[${i + 1}/${teams.length}] ${team.title ?? "(無題)"} (stored rank=${team.rank ?? "-"}, rating=${team.rating ?? "-"})`,
    );
    const teamReport = {
      id: team.id,
      title: team.title,
      sourceUrl: team.source_url,
      storedRank: team.rank ?? null,
      storedRating: team.rating ?? null,
    };
    try {
      const tweet = await tweetFetch(team.source_url);
      const images = tweet.images ?? [];
      teamReport.imageCount = images.length;

      const parseResults = await Promise.all(images.map((img) => analyzeImage(img.dataUrl)));

      // 順位画面として検出されたもの
      const rankScreens = [];
      for (const [idx, r] of parseResults.entries()) {
        if (!r || r.error) continue;
        if (r.screenType === "rank") {
          rankScreens.push({
            index: idx,
            rank: r.result?.rank ?? null,
            rating: r.result?.rating ?? null,
            rawText: (r.rawText ?? "").slice(0, 300),
          });
        }
      }

      teamReport.rankScreensDetected = rankScreens.length;
      teamReport.rankScreens = rankScreens;

      // 判定: 保存済みと一致しているか
      const best = rankScreens[0] ?? null;
      teamReport.parsedRank = best?.rank ?? null;
      teamReport.parsedRating = best?.rating ?? null;
      teamReport.rankMatch =
        team.rank != null && best?.rank != null ? team.rank === best.rank : null;
      teamReport.ratingMatch =
        team.rating != null && best?.rating != null
          ? Math.abs(team.rating - best.rating) < 0.01
          : null;

      console.log(
        `  rank画面検出: ${rankScreens.length}/${images.length}枚 | parsed rank=${best?.rank ?? "-"}, rating=${best?.rating ?? "-"} | match rank=${teamReport.rankMatch}, rating=${teamReport.ratingMatch}`,
      );
    } catch (err) {
      teamReport.error = String(err);
      console.log(`  ERROR: ${err}`);
    }
    report.teams.push(teamReport);
  }

  // 集計
  let rankHit = 0,
    rankTotal = 0,
    rankDetectHit = 0,
    rankDetectTotal = 0,
    ratingHit = 0,
    ratingTotal = 0,
    ratingDetectHit = 0,
    ratingDetectTotal = 0;
  for (const t of report.teams) {
    if (t.storedRank != null) {
      rankDetectTotal++;
      if (t.parsedRank != null) rankDetectHit++;
      rankTotal++;
      if (t.rankMatch === true) rankHit++;
    }
    if (t.storedRating != null) {
      ratingDetectTotal++;
      if (t.parsedRating != null) ratingDetectHit++;
      ratingTotal++;
      if (t.ratingMatch === true) ratingHit++;
    }
  }

  const pct = (a, b) => (b === 0 ? "-" : `${((a / b) * 100).toFixed(1)}%`);
  console.log("\n=== 集計 ===");
  console.log(`順位 検出率 : ${pct(rankDetectHit, rankDetectTotal)} (${rankDetectHit}/${rankDetectTotal})`);
  console.log(`順位 一致率 : ${pct(rankHit, rankTotal)} (${rankHit}/${rankTotal})`);
  console.log(`レート 検出率: ${pct(ratingDetectHit, ratingDetectTotal)} (${ratingDetectHit}/${ratingDetectTotal})`);
  console.log(`レート 一致率: ${pct(ratingHit, ratingTotal)} (${ratingHit}/${ratingTotal})`);

  const outPath = `/tmp/rank-validation-${Date.now()}.json`;
  (await import("node:fs/promises")).writeFile(outPath, JSON.stringify(report, null, 2));
  console.log(`\n詳細: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
